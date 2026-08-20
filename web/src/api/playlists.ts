import {
  experimental_streamedQuery as streamedQuery,
  useQuery,
} from "@tanstack/react-query";
import z from "zod";
import {
  playlistSchema,
  trackSchema,
  type Playlist,
  type Track,
} from "../types";
import api, { fetchStreamedJson, queryKeys } from "./client";

const getUserPlaylists = async () =>
  z.array(playlistSchema).parse(await api.get("/playlists"));

export const useUserPlaylists = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: queryKeys.playlists(),
    queryFn: getUserPlaylists,
    enabled: options?.enabled,
  });

const getPlaylist = async (playlistId: string): Promise<Playlist> =>
  playlistSchema.parse(await api.get(`/playlists/${playlistId}`));

export const usePlaylist = (playlistId: string | null | undefined) =>
  useQuery({
    queryKey: queryKeys.playlistMetadata(playlistId!),
    queryFn: () => getPlaylist(playlistId!),
    enabled: !!playlistId,
  });

const getPlaylistTracks = (
  playlistId: string,
  signal?: AbortSignal
): AsyncIterable<Track[]> =>
  fetchStreamedJson(`/playlists/${playlistId}/tracks`, trackSchema, signal);

export const usePlaylistTracks = (playlistId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.playlistTracks(playlistId!),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => getPlaylistTracks(playlistId!, signal),
      reducer: (tracks: Track[], batch: Track[]) => tracks.concat(batch),
      initialValue: [] as Track[],
    }),
    structuralSharing: false,
    enabled: !!playlistId,
  });
