import { useTrackPreviews } from "@/api/queries";
import useAudioPreloader from "@/features/previews/hooks/useAudioPreloader";
import type { Track } from "@/types/spotify";

const PRELOAD_RADIUS = 5;

const usePreloadSwipePreviews = (tracks: Track[], index: number) => {
  const preloadIsrcs = tracks
    .slice(Math.max(0, index - PRELOAD_RADIUS), index + PRELOAD_RADIUS)
    .map((track) => track.external_ids.isrc);

  const previewQueries = useTrackPreviews(preloadIsrcs);
  const previewUrls = previewQueries.map((q) => q.data?.url).filter((url) => url != null);

  return useAudioPreloader(previewUrls);
};

export default usePreloadSwipePreviews;
