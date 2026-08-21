import { useEffect, useMemo } from "react";
import { useSwipeContext } from "../provider/SwipeContext";
import {
  useMutation,
  useMutationState,
  useQueryClient,
  type MutationState,
} from "@tanstack/react-query";
import { removeFromStorage, storageKeys } from "@/lib/storage";
import { queryKeys } from "@/lib/query";
import { postPlaylistSwipes } from "@/api/api-service";
import type { SwipesSubmissionResult } from "@/types/swipes";

const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session, setHasSubmitted } = useSwipeContext();
  const hasDislikes = session.dislikes.length > 0;

  const mutationKey = useMemo(() => ["submit-swipes", playlist.id] as const, [playlist.id]);

  const { mutate } = useMutation({
    mutationKey,
    mutationFn: () =>
      postPlaylistSwipes(playlist.id, {
        options,
        uris: session.dislikes.map((t) => t.uri),
        tracks_swiped: session.swipes.length,
      }),

    onSuccess: async () => {
      setHasSubmitted(true);
      removeFromStorage(sessionStorage, storageKeys.swipes(playlist.id, playlist.snapshot_id));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists(), refetchType: "none" }),
        queryClient.invalidateQueries({ queryKey: queryKeys.metrics(), refetchType: "none" }),
      ]);
    },
  });

  // https://github.com/TanStack/query/issues/5341
  const submission = useMutationState({
    filters: { mutationKey, exact: true },
    select: (mutation) => mutation.state as MutationState<SwipesSubmissionResult>,
  }).at(-1);

  // submit on page load
  useEffect(() => {
    if (!hasDislikes) return;
    if (queryClient.getMutationCache().find({ mutationKey, exact: true })) return;
    mutate();
  }, [hasDislikes, mutate, mutationKey, queryClient]);

  return {
    hasDislikes,
    isError: submission?.status === "error",
    isSuccess: submission?.status === "success",
    data: submission?.data,
    retry: () => mutate(),
  };
};

export default useSubmitSwipes;
