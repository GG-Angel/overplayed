import { api, routes } from "@/lib/api-client";
import type { SpotifyPlaylist, SpotifyPlaylistTrack } from "@/types/api";
import { useQuery } from "@tanstack/react-query";

const getPlaylists = (): Promise<SpotifyPlaylist[]> => api.get(routes.playlists.all());

const getPlaylist = (id: string): Promise<SpotifyPlaylist> => api.get(routes.playlists.one(id));

const getPlaylistTracks = (
  id: string,
  offset?: number,
  limit?: number
): Promise<SpotifyPlaylistTrack[]> => api.get(routes.playlists.tracks(id, offset, limit));

export const usePlaylists = () =>
  useQuery({
    queryKey: ["playlists"],
    queryFn: getPlaylists,
  });

export const usePlaylist = (id: string | undefined) =>
  useQuery({
    queryKey: ["playlists", id],
    queryFn: () => getPlaylist(id!),
    enabled: !!id,
  });

export const usePlaylistTracks = (id: string | undefined, offset?: number, limit?: number) =>
  useQuery({
    queryKey: ["playlists", id, "tracks"],
    queryFn: () => getPlaylistTracks(id!, offset, limit),
    enabled: !!id,
  });
