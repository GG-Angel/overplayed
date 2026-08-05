import { useTrackPreviewUrls } from "@/features/previews/api/get-track-preview";
import useAudioPreloader from "@/features/previews/hooks/useAudioPreloader";
import type { Track } from "@/lib/types";

const PRELOAD_RADIUS = 5;

const useSwipePreviews = (tracks: Track[], index: number) => {
  const preloadIsrcs = tracks
    .slice(Math.max(0, index - PRELOAD_RADIUS), index + PRELOAD_RADIUS)
    .map((track) => track.external_ids.isrc);

  const previewQueries = useTrackPreviewUrls(preloadIsrcs);
  const previewUrls = previewQueries.map((q) => q.data?.url).filter((url) => url != null);

  return useAudioPreloader(previewUrls);
};

export default useSwipePreviews;
