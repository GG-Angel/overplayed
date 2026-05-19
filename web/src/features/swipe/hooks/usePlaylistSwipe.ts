import usePlaylistItems from "@/features/playlist/hooks/usePlaylistItems";
import useTrackPreviews from "@/features/previews/hooks/useTrackPreviews";
import type { PlaylistItem } from "@/lib/types";
import useSwipes, { type Decision } from "./useSwipes";

export const usePlaylistSwipe = (playlistId: string) => {
  const decisions = useSwipes<PlaylistItem>();
  const index = decisions.swipes.length;

  const playlist = usePlaylistItems(playlistId, index);
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
    id: playlistId,
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
