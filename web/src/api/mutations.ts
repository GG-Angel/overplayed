import type { AccessRequestForm } from "@/types/queue";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postAccessRequest, postLogout, postPlaylistSwipes } from "./api";
import { QUERY_KEYS } from "./queries";
import type { SwipesForm } from "@/types/swipes";

export const MUTATION_KEYS = {
  requestAccess: () => ["request-access"] as const,
  submitSwipes: (playlistId: string) => ["submit-swipes", playlistId] as const,
  logout: () => ["logout"] as const,
} as const;

export const useRequestAccess = (form: AccessRequestForm, turnstileToken: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: MUTATION_KEYS.requestAccess(),
    mutationFn: () => postAccessRequest(form, turnstileToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queueStatus() });
    },
  });
};

export const useSubmitSwipes = (playlistId: string, form: SwipesForm) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: MUTATION_KEYS.submitSwipes(playlistId),
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
    mutationKey: MUTATION_KEYS.logout(),
    mutationFn: postLogout,
    onMutate: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(), refetchType: "none" });
    },
  });
};
