import { env } from "@/lib/env";
import {
  accessRequestResultSchema,
  accessStatusSchema,
  queueStatusSchema,
  type AccessRequestForm,
} from "@/types/queue";
import {
  playlistSchema,
  trackSchema,
  trackPreviewSchema,
  currentUserSchema,
} from "@/types/spotify";
import {
  swipesLeaderboardSchema,
  swipesSubmissionResultSchema,
  type SwipesForm,
} from "@/types/swipes";
import z, { ZodType } from "zod";
import { queueApi, serverApi } from "./api-client";
import { countersSchema, userStatsSchema } from "@/types/stats";
import { isAxiosError } from "axios";

export const getCurrentUser = async () => {
  try {
    return currentUserSchema.parse(await serverApi.get("/users/me"));
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};

export const getPlaylist = async (playlistId: string) => {
  return playlistSchema.parse(await serverApi.get(`/playlists/${playlistId}`));
};

export const getPlaylists = async () => {
  return z.array(playlistSchema).parse(await serverApi.get("/playlists"));
};

export const getPlaylistTracks = (playlistId: string, signal?: AbortSignal) => {
  return fetchStreamedJson(`/playlists/${playlistId}/tracks`, trackSchema, signal);
};

export const getTrackPreview = async (isrc: string) => {
  return trackPreviewSchema.parse(await serverApi.get(`/previews/${isrc}`));
};

export const getCounters = async () => {
  return countersSchema.parse(await serverApi.get(`/stats`));
};

export const getUserStats = async () => {
  return userStatsSchema.parse(await serverApi.get(`/stats/me`));
};

export const getLeaderboard = async () => {
  return swipesLeaderboardSchema.parse(await serverApi.get("/users/leaderboard"));
};

export const getQueueStatus = async () => {
  return queueStatusSchema.parse(await queueApi.get("/queue/overview"));
};

export const getAccessStatus = async (userEmail: string) => {
  try {
    return accessStatusSchema.parse(
      await queueApi.get(`/queue/users/${encodeURIComponent(userEmail)}`)
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const postPlaylistSwipes = async (playlistId: string, form: SwipesForm) => {
  return swipesSubmissionResultSchema.parse(
    await serverApi.post(`/playlists/${playlistId}/swipes`, form)
  );
};

export const postAccessRequest = async (form: AccessRequestForm, turnstileToken: string) => {
  return accessRequestResultSchema.parse(
    await queueApi.post("/queue/requests", {
      ...form,
      "cf-turnstile-response": turnstileToken,
    })
  );
};

export const postLogout = async () => await serverApi.post("/auth/logout");

// --- Helpers ---

/**
 * Streams NDJSON items, yielding one batch per read.
 * @param url The url to fetch from, relative to the API base URL.
 * @param schema The Zod schema to validate each line of the response.
 * @param signal Optional AbortSignal to cancel the request.
 */
async function* fetchStreamedJson<T>(url: string, schema: ZodType<T>, signal?: AbortSignal) {
  const response = await fetch(`${env.API_BASE_URL}${url}`, {
    headers: { Accept: "application/x-ndjson" },
    credentials: "include",
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch stream: ${response.statusText}`);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  const parseLines = (lines: string[]) =>
    lines.filter((line) => line.trim()).map((line) => schema.parse(JSON.parse(line)));

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = (buffer + value).split("\n");
      buffer = lines.pop() ?? ""; // the last entry is an incomplete line

      const batch = parseLines(lines);
      if (batch.length) yield batch;
    }

    const trailing = parseLines([buffer]);
    if (trailing.length) yield trailing;
  } finally {
    await reader.cancel();
  }
}
