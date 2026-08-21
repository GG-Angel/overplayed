import { postAccessRequest } from "@/api/api-service";
import { queryKeys } from "@/lib/query";
import type { AccessRequestForm } from "@/types/queue";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSendAccessRequest = (form: AccessRequestForm, turnstileToken: string) => {
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
