import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSwipeContext } from "../provider/SwipeContext";
import { useCallback, useMemo } from "react";
import { submitSwipes } from "../api/submit-swipes";

const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session } = useSwipeContext();

  const tracksToRemove = useMemo(() => session.dislikes.map((t) => t.uri), [session.dislikes]);
  const canSubmit = tracksToRemove.length > 0;

  const submitMutation = useMutation({
    mutationFn: () =>
      submitSwipes(playlist.metadata.id, {
        options,
        uris: tracksToRemove,
        tracks_swiped: session.swipes.length,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.metrics }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard }),
      ]);
    },
  });

  const start = useCallback(() => {
    if (!canSubmit) return;
    submitMutation.mutate();
  }, [submitMutation, canSubmit]);

  return {
    start,
    canSubmit,
    mutation: submitMutation,
  };
};

export default useSubmitSwipes;
