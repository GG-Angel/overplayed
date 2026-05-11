import { get, routes } from "@/lib/api-client";
import type { SpotifyPlaylist } from "@/types/api";
import { useQuery } from "@tanstack/react-query";

const getPlaylists = async () => await get<SpotifyPlaylist[]>(routes.playlists.all());

export const usePlaylists = () =>
  useQuery({
    queryKey: ["playlists"],
    queryFn: getPlaylists,
  });
