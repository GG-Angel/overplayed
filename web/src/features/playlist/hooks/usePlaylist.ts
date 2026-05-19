import { getPlaylist } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const usePlaylist = (playlistId: string) =>
  useQuery({
    queryKey: queryKeys.playlists.one(playlistId),
    queryFn: () => getPlaylist(playlistId),
  });
