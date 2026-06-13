import { useSwipeContext } from "../provider/SwipeContext";
import { useTrackPreviewUrls } from "@/features/previews/api/get-track-preview";
import useAudioPreloader from "@/features/previews/hooks/useAudioPreloader";

const PRELOAD_RADIUS = 5;

const useSwipePreviews = () => {
  const { session, playlist } = useSwipeContext();

  const currentIndex = session.swipes.length;
  const preloadIsrcs = playlist.tracks
    .slice(Math.max(0, currentIndex - PRELOAD_RADIUS), currentIndex + PRELOAD_RADIUS)
    .map((track) => track.external_ids.isrc);

  const previewQueries = useTrackPreviewUrls(preloadIsrcs);
  const previewUrls = previewQueries.filter((q) => q.isSuccess).map((q) => q.data.url);

  return useAudioPreloader(previewUrls);
};

export default useSwipePreviews;
