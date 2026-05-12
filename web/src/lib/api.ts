import z from "zod";
import api from "./api-client";
import {
  currentUserSchema,
  playlistItemsPageSchema,
  playlistSchema,
  trackPreviewSchema,
} from "./types";

const DEFAULT_PLAYLIST_ITEMS_LIMIT = 100;

export const getUser = async () => {
  const { data } = await api.get("/users/me");
  return currentUserSchema.parse(data);
};

export const getPlaylists = async () => {
  const { data } = await api.get("/playlists");
  return z.array(playlistSchema).parse(data);
};

export const getPlaylist = async (id: string) => {
  const { data } = await api.get(`/playlists/${id}`);
  return playlistSchema.parse(data);
};

export const getPlaylistItems = async (
  id: string,
  offset: number,
  limit: number = DEFAULT_PLAYLIST_ITEMS_LIMIT
) => {
  const { data } = await api.get(
    `/playlists/${id}/tracks?${new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    })}`
  );
  return playlistItemsPageSchema.parse(data);
};

export const getTrackPreview = async (isrc: string) => {
  const { data } = await api.get(`/previews/${isrc}`);
  return trackPreviewSchema.parse(data);
};
