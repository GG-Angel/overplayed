import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type QueueAccessRequest } from "@/lib/types";
import { postAccessRequest as postAccessRequest } from "@/api/api";

export const useSendAccessRequest = (form: QueueAccessRequest, turnstileToken: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => postAccessRequest(form, turnstileToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
