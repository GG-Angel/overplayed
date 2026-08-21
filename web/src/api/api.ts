import api, { fetchStreamedJson, queueApi } from "@/lib/api";
import {
  accessRequestResultSchema,
  accessStatusSchema,
  queueStatusSchema,
  type AccessRequestForm,
} from "@/types/queue";
import { playlistSchema, trackSchema, trackPreviewSchema } from "@/types/spotify";
import {
  globalUserStatsSchema as globalSwipeStatsSchema,
  userStatsSchema as swipeStatsSchema,
} from "@/types/stats";
import {
  swipesLeaderboardSchema,
  swipesSubmissionResultSchema,
  type SwipesForm,
} from "@/types/swipes";
import z from "zod";

export const getPlaylist = async (playlistId: string) => {
  return playlistSchema.parse(await api.get(`/playlists/${playlistId}`));
};

export const getPlaylists = async () => {
  return z.array(playlistSchema).parse(await api.get("/playlists"));
};

export const getPlaylistTracks = (playlistId: string, signal?: AbortSignal) => {
  return fetchStreamedJson(`/playlists/${playlistId}/tracks`, trackSchema, signal);
};

export const getTrackPreviewUrl = async (isrc: string) => {
  return trackPreviewSchema.parse(await api.get(`/previews/${isrc}`));
};

export const getGlobalSwipeStats = async () => {
  return globalSwipeStatsSchema.parse(await api.get(`/stats`));
};

export const getSwipeStats = async () => {
  return swipeStatsSchema.parse(await api.get(`/stats/me`));
};

export const getSwipeLeaderboard = async () => {
  return swipesLeaderboardSchema.parse(await api.get("/users/leaderboard"));
};

export const postPlaylistSwipes = async (playlistId: string, form: SwipesForm) => {
  return swipesSubmissionResultSchema.parse(
    await api.post(`/playlists/${playlistId}/swipes`, form)
  );
};

export const getQueueStatus = async () => {
  return queueStatusSchema.parse(await queueApi.get("/queue/overview"));
};

export const getAccessStatus = async (userEmail: string) => {
  return accessStatusSchema.parse(
    await queueApi.get(`/queue/users/${encodeURIComponent(userEmail)}`)
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
