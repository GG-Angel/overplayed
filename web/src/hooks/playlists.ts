import { api, routes } from "@/lib/api-client";
import type { SpotifyPlaylist } from "@/types/api";
import { useQuery } from "@tanstack/react-query";

const getPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  return await api.get(routes.playlists.all());
};

export const usePlaylists = () =>
  useQuery({
    queryKey: ["playlists"],
    queryFn: getPlaylists,
  });
