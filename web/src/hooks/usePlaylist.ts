import { getPlaylist } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const usePlaylist = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.playlists.one(id!),
    queryFn: () => getPlaylist(id!),
    enabled: !!id,
  });
