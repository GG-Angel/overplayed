import { createPlaylist } from "@/features/playlist/api/create-playlist";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlaylistItems } from "@/features/playlist/api/update-playlist-items";
import { useSwipeContext } from "../provider/SwipeContext";
import { useMemo, useState } from "react";

type SubmitSwipesPhase = "creating-backup" | "populating-backup" | "removing-tracks";

const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session } = useSwipeContext();
  const [phase, setPhase] = useState<SubmitSwipesPhase | null>(null);

  const tracksToRemove = useMemo(() => session.dislikes.map((t) => t.uri), [session.dislikes]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (options.backupEnabled) {
        setPhase("creating-backup");
        const backupPlaylist = await createPlaylist();

        setPhase("populating-backup");
        await updatePlaylistItems(backupPlaylist.id, tracksToRemove, "add");
      }

      setPhase("removing-tracks");
      await updatePlaylistItems(playlist.metadata.id, tracksToRemove, "remove");
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
    },
  });

  return { ...mutation, phase };
};

export default useSubmitSwipes;
