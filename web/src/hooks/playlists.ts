import { api, routes } from "@/lib/api-client";
import type { SpotifyPlaylist } from "@/types/api";
import { useQuery } from "@tanstack/react-query";

const getPlaylists = (): Promise<SpotifyPlaylist[]> => api.get(routes.playlists.all());

const getPlaylist = (id: string): Promise<SpotifyPlaylist> => api.get(routes.playlists.one(id));

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
