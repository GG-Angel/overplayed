import { queryOptions, useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import api from "@/lib/api-client";
import { trackPreviewSchema } from "@/lib/types";

const getTrackPreview = async (isrc: string) => {
  const response = await api.get(`/previews/${isrc}`);
  const { preview_url: previewUrl } = trackPreviewSchema.parse(response);
  return new Audio(previewUrl);
};

const trackPreviewOptions = (isrc: string) =>
  queryOptions({
    queryKey: queryKeys.preview(isrc),
    queryFn: () => getTrackPreview(isrc),
  });

const useTrackPreviews = (isrcs: string[]) =>
  useQueries({
    queries: isrcs.map((isrc) => trackPreviewOptions(isrc)),
  });

export default useTrackPreviews;
