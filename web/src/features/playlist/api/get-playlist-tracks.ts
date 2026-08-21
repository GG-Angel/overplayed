import { getPlaylistTracks } from "@/api/api-service";
import { queryKeys } from "@/lib/query";
import type { Track } from "@/types/spotify";
import { experimental_streamedQuery as streamedQuery, useQuery } from "@tanstack/react-query";

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.playlistTracks(playlistId!),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => getPlaylistTracks(playlistId!, signal),
      reducer: (tracks: Track[], batch: Track[]) => tracks.concat(batch),
      initialValue: [] as Track[],
    }),
    // the reducer already returns a fresh array, so
    // diffing it against the previous one is pointless
    structuralSharing: false,
    enabled: !!playlistId,
  });
};
