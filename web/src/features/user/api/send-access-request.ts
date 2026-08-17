import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type QueueAccessRequest } from "@/lib/types";

export const useSendAccessRequest = (form: QueueAccessRequest, turnstileToken: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await queueApi.post("/queue/requests", { ...form, "cf-turnstile-response": turnstileToken });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
