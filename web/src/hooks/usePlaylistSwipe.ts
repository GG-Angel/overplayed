import usePaginatedPlaylistItems from "./usePaginatedPlaylistItems";
import useSwipeDecisions, { type Decision } from "./useSwipeDecisions";
import useTrackPreviews from "./useTrackPreviews";

export const usePlaylistSwipe = (id: string | undefined) => {
  const { swipes, likes, dislikes, undo, record } = useSwipeDecisions();
  const currentIndex = swipes.length;

  const { items, total, isLoading } = usePaginatedPlaylistItems(id, currentIndex);
  const { audio, isError: isAudioError } = useTrackPreviews(
    items.map((item) => item.track.external_ids.isrc),
    currentIndex
  );

  const currentItem = items.at(currentIndex);

  const swipe = (decision: Decision) => {
    if (!currentItem) return;
    record(currentItem.track.id, decision);
  };

  return {
    index: currentIndex,
    item: currentItem,
    audio,
    isAudioError,
    total,
    items,
    swipes,
    likes,
    dislikes,
    swipe,
    undo,
    isLoading,
  };
};
