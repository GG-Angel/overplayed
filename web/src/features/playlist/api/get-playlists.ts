import { getPlaylists } from "@/api/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const usePlaylists = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.playlists(),
    queryFn: getPlaylists,
    enabled: options?.enabled,
  });
};
