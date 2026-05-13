import { getTrackPreviewAudio } from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";

export const trackPreviewQueryOptions = (isrc: string) =>
  queryOptions({
    queryKey: ["preview", isrc],
    queryFn: () => getTrackPreviewAudio(isrc),
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
