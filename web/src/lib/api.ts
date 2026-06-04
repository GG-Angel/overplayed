import api from "./api-client";
import { playlistMetadataSchema, type SwipeSessionDetails } from "./types";

export const buildURLWithParams = (
  url: string,
  params?: Record<string, string | number>
): string => {
  if (!params) return url;
  const paramsString = new URLSearchParams(params as Record<string, string>).toString();
  return `${url}?${paramsString}`;
};

export const createNewPlaylist = async () => {
  const response = await api.post("/playlists");
  return playlistMetadataSchema.parse(response);
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
