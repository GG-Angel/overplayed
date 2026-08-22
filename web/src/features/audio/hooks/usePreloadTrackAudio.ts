import { useTrackPreviews } from "@/api/queries";
import usePreloadAudio from "@/features/audio/hooks/usePreloadAudio";
import type { Track } from "@/types/spotify";

const PRELOAD_RANGE = 5;

const usePreloadTrackAudio = (tracks: Track[], currentTrackIndex: number) => {
  const start = Math.max(0, currentTrackIndex - PRELOAD_RANGE);
  const end = Math.min(tracks.length, currentTrackIndex + PRELOAD_RANGE);

  const window = tracks.slice(start, end).map((track) => track.external_ids.isrc);

  const trackPreviews = useTrackPreviews(window);
  return usePreloadAudio(trackPreviews.urls);
};

export default usePreloadTrackAudio;
