import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSwipeContext } from "../provider/SwipeContext";
import { useCallback, useMemo, useState } from "react";
import type { PlaylistMetadata } from "@/lib/types";
import { useLogSwipeSession } from "@/features/metrics/api/log-swipe-session";
import { createPlaylist } from "@/features/playlist/api/create-playlist";
import { updatePlaylistItems } from "@/features/playlist/api/update-playlist-items";

type SubmitSwipesPhase = "creating-backup" | "populating-backup" | "removing-tracks";

export const SWIPE_PHASE_DESCRIPTIONS: Record<SubmitSwipesPhase, string> = {
  "creating-backup": "Creating backup playlist...",
  "populating-backup": "Backing up tracks...",
  "removing-tracks": "Removing tracks...",
};

const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session, timer } = useSwipeContext();

  const [phase, setPhase] = useState<SubmitSwipesPhase | null>(null);
  const [backupPlaylist, setBackupPlaylist] = useState<PlaylistMetadata | null>(null);

  const tracksToRemove = useMemo(() => session.dislikes.map((t) => t.uri), [session.dislikes]);
  const canSubmit = tracksToRemove.length > 0;

  const logMutation = useLogSwipeSession({
    playlist_id: playlist.metadata.id,
    total_tracks: playlist.totalTracks,
    tracks_swiped: session.swipes.length,
    tracks_cut: session.dislikes.length,
    started_at: timer.stop().startedAt,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (options.backupEnabled) {
        setPhase("creating-backup");
        const newBackupPlaylist = await createPlaylist();
        setBackupPlaylist(newBackupPlaylist);

        setPhase("populating-backup");
        await updatePlaylistItems(newBackupPlaylist.id, tracksToRemove, "add");
      }

      setPhase("removing-tracks");
      await updatePlaylistItems(playlist.metadata.id, tracksToRemove, "remove");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
      await logMutation.mutateAsync();
    },
  });

  const start = useCallback(() => {
    if (!canSubmit) return;
    submitMutation.mutate();
  }, [submitMutation, canSubmit]);

  return {
    start,
    phase,
    backupPlaylist,
    canSubmit,
    isPending: submitMutation.isPending,
    isSuccess: submitMutation.isSuccess,
    isError: submitMutation.isError,
  };
};

export default useSubmitSwipes;
