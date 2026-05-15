import z from "zod";
import api from "./api-client";
import {
  currentUserSchema,
  playlistItemsPageSchema,
  playlistSchema,
  trackPreviewSchema,
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

export const getPlaylist = async (id: string) => {
  const response = await api.get(`/playlists/${id}`);
  return playlistSchema.parse(response);
};

export const getPlaylistItems = async (id: string, page: number) => {
  const response = await api.get(
    `/playlists/${id}/items?${new URLSearchParams({
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
