import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import type { SwipeSessionData } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const logSwipeSession = async (data: SwipeSessionData) => {
  await api.post(`/metrics/swipe-sessions`, data);
};

export const useLogSwipeSession = (data: SwipeSessionData) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logSwipeSession(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
    },
  });
};
