import { queryKeys } from "@/lib/query";
import { type Track } from "@/lib/types";
import { experimental_streamedQuery, useQuery } from "@tanstack/react-query";

const getPlaylistTracks = async (playlistId: string): Promise<AsyncIterable<Track>> => {
  
};

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.playlistTracks(playlistId!),
    queryFn: () =>
      experimental_streamedQuery({
        streamFn: () => getPlaylistTracks(playlistId!),
      }),
    enabled: !!playlistId,
    retry: 3,
  });
};
