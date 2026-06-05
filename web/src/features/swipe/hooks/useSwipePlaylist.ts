import usePlaylistItems from "@/features/playlist/hooks/usePlaylistItems";
import type { PlaylistItem } from "@/lib/types";
import useSwipes, { type SwipeDecision } from "./useSwipes";

const PREVIEW_PRELOAD_LIMIT = 5;

export const useSwipePlaylist = (playlistId: string) => {
  const decisions = useSwipes<PlaylistItem>();
  const currentIndex = decisions.swipes.length;

  const playlist = usePlaylistItems(playlistId, currentIndex);
  const previews = useTrackPreviews(
    playlist.items
      .slice(currentIndex, currentIndex + PREVIEW_PRELOAD_LIMIT)
      .map((item) => item.track.external_ids.isrc)
  );

  const currentItem = playlist.items.at(currentIndex);
  const currentPreview = previews.at(0);

  const swipe = (decision: SwipeDecision) => {
    if (!currentItem) return;
    decisions.record(currentItem, decision);
  };

  return {
    playlistId,
    ...playlist,
    currentIndex,
    currentItem,
    currentAudioUrl: currentPreview?.data?.src,
    isAudioError: currentPreview?.isError,
    isAudioLoading: currentPreview?.isLoading,
    swipes: decisions.swipes,
    likes: decisions.likes,
    dislikes: decisions.dislikes,
    swipe: swipe,
    undo: decisions.undo,
  };
};
