import type { AccessRequestForm } from "@/types/queue";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postAccessRequest, postLogout, postPlaylistSwipes } from "./api";
import { QUERY_KEYS } from "./queries";
import type { SwipesForm } from "@/types/swipes";

export const useRequestAccess = (form: AccessRequestForm, turnstileToken: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postAccessRequest(form, turnstileToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queueStatus() });
    },
  });
};

export const useSubmitSwipes = (playlistId: string, form: SwipesForm) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postPlaylistSwipes(playlistId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userStats() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.globalStats() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.globalLeaderboard() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.globalCounters() });

      // avoid immediate refetch to maintain pre-submission playlist info
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlists(), refetchType: "none" });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLogout,
    onMutate: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(), refetchType: "none" });
    },
  });
};
