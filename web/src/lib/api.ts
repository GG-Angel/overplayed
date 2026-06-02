import api from "./api-client";
import { playlistSchema, type SwipeSessionDetails } from "./types";

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

export const logSwipeSession = async (data: SwipeSessionDetails) => {
  await api.post(`/metrics/swipe-sessions`, data);
};
