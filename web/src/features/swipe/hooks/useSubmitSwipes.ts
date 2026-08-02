import { queryKeys } from "@/lib/query";
import { removeFromStorage, storageKeys } from "@/lib/storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSwipeContext } from "../provider/SwipeContext";
import { submitSwipes } from "../api/submit-swipes";

const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session, setHasSubmitted } = useSwipeContext();
  const hasDislikes = session.dislikes.length > 0;
  const hasStarted = useRef(false);

  const mutation = useMutation({
    mutationFn: () =>
      submitSwipes(playlist.metadata.id, {
        options,
        uris: session.dislikes.map((t) => t.uri),
        tracks_swiped: session.swipes.length,
      }),
    onSuccess: async () => {
      removeFromStorage(
        sessionStorage,
        storageKeys.swipes(playlist.metadata.id, playlist.metadata.snapshot_id)
      );
      setHasSubmitted(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.metrics() }),
      ]);
    },
  });

  const { mutate } = mutation;
  useEffect(() => {
    if (!hasDislikes || hasStarted.current) return;
    hasStarted.current = true;
    mutate();
  }, [hasDislikes, mutate]);

  return {
    hasDislikes,
    mutation,
    retry: () => mutate(),
  };
};

export default useSubmitSwipes;
