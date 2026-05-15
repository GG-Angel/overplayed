import type { PlaylistItem } from "@/lib/types";
import usePlaylistItems from "./usePlaylistItems";
import useSwipes, { type Decision } from "./useSwipes";
import useTrackPreviews from "./useTrackPreviews";

export const usePlaylistSwipe = (id: string) => {
  const decisions = useSwipes<PlaylistItem>();
  const index = decisions.swipes.length;

  const playlist = usePlaylistItems(id, index);
  const { audio, isError: isAudioError } = useTrackPreviews(
    playlist.items.map((item) => item.track.external_ids.isrc),
    index
  );

  const item = playlist.items.at(index);

  const swipe = (decision: Decision) => {
    if (!item) return;
    decisions.record(item, decision);
  };

  return {
    index,
    item,
    audio,
    isAudioError,
    swipe,
    swipes: decisions.swipes,
    likes: decisions.likes,
    dislikes: decisions.dislikes,
    undo: decisions.undo,
    ...playlist,
  };
};
