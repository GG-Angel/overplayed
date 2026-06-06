import { useSwipeContext } from "../provider/SwipeContext";
import { useTrackPreviewUrls } from "@/features/previews/api/get-track-preview";
import useAudioPreloader from "@/features/previews/hooks/useAudioPreloader";
import { useMemo } from "react";

const PRELOAD_RADIUS = 5;

const useSwipePreviews = () => {
  const { session, playlist } = useSwipeContext();

  const currentIndex = session.swipes.length;

  const isrcsToPreload = playlist.tracks
    .slice(Math.max(0, currentIndex - PRELOAD_RADIUS), currentIndex + PRELOAD_RADIUS)
    .map((track) => track.external_ids.isrc);

  const previewQueries = useTrackPreviewUrls(isrcsToPreload);

  const previewUrls = useMemo(() => {
    return previewQueries.filter((q) => q.isSuccess).map((q) => q.data.preview_url);
  }, [previewQueries]);

  return useAudioPreloader(previewUrls);
};

export default useSwipePreviews;
