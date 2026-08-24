import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queueAccessResponseSchema, type QueueAccessRequest } from "@/lib/types";

const sendAccessRequest = async (form: QueueAccessRequest, turnstileToken: string) => {
  return queueAccessResponseSchema.parse(
    await queueApi.post("/queue/requests", {
      ...form,
      "cf-turnstile-response": turnstileToken,
    })
  );
};

export const useSendAccessRequest = (form: QueueAccessRequest, turnstileToken: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => sendAccessRequest(form, turnstileToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
