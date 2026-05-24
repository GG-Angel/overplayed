import z from "zod";
import api from "./api-client";
import {
  counterSchema,
  currentUserSchema,
  playlistItemsPageSchema,
  playlistSchema,
  trackPreviewSchema,
  type Counter,
  type SwipeSessionLog,
} from "./types";

export const getUser = async () => {
  const response = await api.get("/users/me");
  const result = currentUserSchema.parse(response);
  return result;
};

export const getPlaylists = async () => {
  const response = await api.get("/playlists");
  return z.array(playlistSchema).parse(response);
};

export const getPlaylist = async (playlistId: string) => {
  const response = await api.get(`/playlists/${playlistId}`);
  return playlistSchema.parse(response);
};

export const getPlaylistItems = async (playlistId: string, page: number) => {
  const response = await api.get(
    `/playlists/${playlistId}/items?${new URLSearchParams({
      page: page.toString(),
    })}`
  );
  return playlistItemsPageSchema.parse(response);
};

export const getTrackPreview = async (isrc: string) => {
  const response = await api.get(`/previews/${isrc}`);
  return trackPreviewSchema.parse(response);
};

export const getTrackPreviewAudio = async (isrc: string) => {
  const { preview_url: previewUrl } = await getTrackPreview(isrc);
  const audio = new Audio(previewUrl);
  audio.preload = "auto";
  return audio;
};

export const createNewPlaylist = async () => {
  const response = await api.post("/playlists");
  return playlistSchema.parse(response);
};

export const updatePlaylistItems = async (
  playlistId: string,
  uris: string[],
  action: "add" | "remove"
) => {
  await api.post(`/playlists/${playlistId}/items?${new URLSearchParams({ action })}`, { uris });
};

export const getMetric = async (metric: Counter["metric"]) => {
  const response = await api.get(`/metrics/${metric}`);
  return counterSchema.parse(response);
};

export const logSwipeSession = async (data: SwipeSessionLog) => {
  await api.post(`/metrics/swipe-sessions`, data);
};
