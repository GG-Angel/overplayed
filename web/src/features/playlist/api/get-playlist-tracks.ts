import { fetchStreamedJson } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { trackSchema, type Track } from "@/lib/types";
import { experimental_streamedQuery as streamedQuery, useQuery } from "@tanstack/react-query";

const getPlaylistTracks = (playlistId: string, signal?: AbortSignal): AsyncIterable<Track> => {
  return fetchStreamedJson(`/playlists/${playlistId}/tracks`, trackSchema, signal);
};

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.playlistTracks(playlistId!),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => getPlaylistTracks(playlistId!, signal),
    }),
    enabled: !!playlistId,
  });
};
