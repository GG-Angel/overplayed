import { useQueries } from "@tanstack/react-query";
import { getTrackPreviewAudio } from "@/lib/api";
import { queryKeys } from "@/lib/query";

const QUEUE_SIZE = 5;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const useTrackPreviews = (isrcs: string[], index: number) => {
  const window = isrcs.slice(index, index + QUEUE_SIZE);

  const previews = useQueries({
    queries: window.map((isrc) => ({
      queryKey: queryKeys.preview(isrc),
      queryFn: () => getTrackPreviewAudio(isrc),
      staleTime: CACHE_TTL,
      gcTime: CACHE_TTL,
    })),
  });

  const current = previews.at(0);

  return {
    audio: current?.data,
    isError: current?.isError ?? true,
  };
};

export default useTrackPreviews;
