import { get, routes } from "@/lib/api-client";
import type { SpotifyPlaylist } from "@/types/api";
import { useQuery } from "@tanstack/react-query";

const getPlaylist = async (id: string) => await get<SpotifyPlaylist>(routes.playlists.one(id));

export const usePlaylist = (id: string | undefined) =>
  useQuery({
    queryKey: ["playlists", id],
    queryFn: () => getPlaylist(id!),
    enabled: !!id,
  });
