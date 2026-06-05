import { createPlaylist } from "@/features/playlist/api/create-playlist";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlaylistItems } from "@/features/playlist/api/update-playlist-items";
import { useSwipeContext } from "../provider/SwipeContext";
import { useMemo, useState } from "react";
import type { PlaylistMetadata } from "@/lib/types";

type SubmitSwipesPhase = "creating-backup" | "populating-backup" | "removing-tracks";

const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session } = useSwipeContext();

  const [phase, setPhase] = useState<SubmitSwipesPhase | null>(null);
  const [backupPlaylist, setBackupPlaylist] = useState<PlaylistMetadata | null>(null);

  const tracksToRemove = useMemo(() => session.dislikes.map((t) => t.uri), [session.dislikes]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (options.backupEnabled) {
        setPhase("creating-backup");
        const newBackupPlaylist = await createPlaylist();

        setPhase("populating-backup");
        await updatePlaylistItems(newBackupPlaylist.id, tracksToRemove, "add");

        setBackupPlaylist(newBackupPlaylist);
      }

      setPhase("removing-tracks");
      await updatePlaylistItems(playlist.metadata.id, tracksToRemove, "remove");
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
    },
  });

  return {
    start: () => mutation.mutate(),
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    mutation: mutation.isSuccess,
    phase,
    backupPlaylist,
  };
};

export default useSubmitSwipes;
