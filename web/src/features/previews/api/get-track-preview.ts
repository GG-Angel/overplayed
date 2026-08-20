import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { getTrackPreviewUrl } from "@/api/api";

const getTrackPreviewUrlQueryOptions = (isrc: string | undefined) => {
  return queryOptions({
    queryKey: queryKeys.trackPreview(isrc!),
    queryFn: () => getTrackPreviewUrl(isrc!),
    staleTime: ({ state }) => (state.data?.expires_in ?? 60 * 60) * 1000,
    enabled: !!isrc,
  });
};

export const useTrackPreviewUrl = (isrc: string | undefined) => {
  return useQuery(getTrackPreviewUrlQueryOptions(isrc));
};

export const useTrackPreviewUrls = (isrcs: (string | undefined)[]) => {
  return useQueries({
    queries: isrcs.map((isrc) => getTrackPreviewUrlQueryOptions(isrc)),
  });
};
