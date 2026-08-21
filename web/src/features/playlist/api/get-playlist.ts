import { getPlaylist } from "@/api/api-service";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const usePlaylist = (playlistId: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.playlistMetadata(playlistId!),
    queryFn: () => getPlaylist(playlistId!),
    enabled: !!playlistId,
  });
};
