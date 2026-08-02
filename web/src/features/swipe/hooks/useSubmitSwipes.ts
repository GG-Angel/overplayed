import { queryKeys } from "@/lib/query";
import { removeFromStorage, storageKeys } from "@/lib/storage";
import type { SwipeSubmissionResponse } from "@/lib/types";
import {
  useMutation,
  useMutationState,
  useQueryClient,
  type MutationState,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useSwipeContext } from "../provider/SwipeContext";
import { submitSwipes } from "../api/submit-swipes";

const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session, setHasSubmitted } = useSwipeContext();
  const { id, snapshot_id } = playlist.metadata;
  const hasDislikes = session.dislikes.length > 0;

  const mutationKey = useMemo(() => ["submit-swipes", id] as const, [id]);

  const { mutate } = useMutation({
    mutationKey,
    mutationFn: () =>
      submitSwipes(id, {
        options,
        uris: session.dislikes.map((t) => t.uri),
        tracks_swiped: session.swipes.length,
      }),
    onSuccess: async () => {
      removeFromStorage(sessionStorage, storageKeys.swipes(id, snapshot_id));
      setHasSubmitted(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.metrics() }),
      ]);
    },
  });

  // https://github.com/TanStack/query/issues/5341
  const submission = useMutationState({
    filters: { mutationKey, exact: true },
    select: (mutation) => mutation.state as MutationState<SwipeSubmissionResponse>,
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
