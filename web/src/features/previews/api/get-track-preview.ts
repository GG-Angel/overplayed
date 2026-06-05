import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import api from "@/lib/api-client";
import { trackPreviewSchema, type TrackPreview } from "@/lib/types";

const getTrackPreviewUrl = async (isrc: string): Promise<TrackPreview> => {
  return trackPreviewSchema.parse(await api.get(`/previews/${isrc}`));
};

const getTrackPreviewUrlQueryOptions = (isrc: string) => {
  return queryOptions({
    queryKey: queryKeys.preview(isrc),
    queryFn: () => getTrackPreviewUrl(isrc),
  });
};

export const useTrackPreviewUrl = (isrc: string) => {
  return useQuery(getTrackPreviewUrlQueryOptions(isrc));
};

export const useTrackPreviewUrls = (isrcs: string[]) => {
  return useQueries({
    queries: isrcs.map((isrc) => getTrackPreviewUrlQueryOptions(isrc)),
  });
};
