import api, { fetchStreamedJson, queueApi } from "@/lib/api";
import {
  leaderboardSchema,
  globalMetricsSchema,
  userMetricsSchema,
  trackSchema,
  playlistSchema,
  trackPreviewSchema,
  type SwipeSubmissionForm,
  swipeSubmissionResponseSchema,
  queueOverviewSchema,
  queueUserStatusSchema,
  type QueueAccessRequest,
  queueAccessResponseSchema,
} from "@/lib/types";
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
  return globalMetricsSchema.parse(await api.get(`/stats`));
};

export const getSwipeStats = async () => {
  return userMetricsSchema.parse(await api.get(`/stats/me`));
};

export const getSwipeLeaderboard = async () => {
  return leaderboardSchema.parse(await api.get("/users/leaderboard"));
};

export const postPlaylistSwipes = async (playlistId: string, form: SwipeSubmissionForm) => {
  return swipeSubmissionResponseSchema.parse(
    await api.post(`/playlists/${playlistId}/swipes`, form)
  );
};

export const getQueueStatus = async () => {
  return queueOverviewSchema.parse(await queueApi.get("/queue/overview"));
};

export const getUserAccessStatus = async (userEmail: string) => {
  return queueUserStatusSchema.parse(
    await queueApi.get(`/queue/users/${encodeURIComponent(userEmail)}`)
  );
};

export const postAccessRequest = async (form: QueueAccessRequest, turnstileToken: string) => {
  return queueAccessResponseSchema.parse(
    await queueApi.post("/queue/requests", {
      ...form,
      "cf-turnstile-response": turnstileToken,
    })
  );
};
