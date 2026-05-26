import usePlaylistItems from "@/features/playlist/hooks/usePlaylistItems";
import useTrackPreviews from "@/features/previews/hooks/useTrackPreviews";
import type { PlaylistItem } from "@/lib/types";
import useSwipeManager, { type Decision } from "./useSwipeManager";

export const useSwipePlaylist = (playlistId: string) => {
  const decisions = useSwipeManager<PlaylistItem>();
  const currentIndex = decisions.swipes.length;

  const playlist = usePlaylistItems(playlistId, currentIndex);
  const previews = useTrackPreviews(
    playlist.items.map((item) => item.track.external_ids.isrc),
    currentIndex
  );

  const currentItem = playlist.items.at(currentIndex);

  const swipe = (decision: Decision) => {
    if (!currentItem) return;
    decisions.record(currentItem, decision);
  };

  return {
    playlistId,
    ...playlist,
    currentIndex,
    currentItem,
    currentAudio: previews.audio,
    isAudioError: previews.isError,
    swipes: decisions.swipes,
    likes: decisions.likes,
    dislikes: decisions.dislikes,
    swipe: swipe,
    undo: decisions.undo,
  };
};
