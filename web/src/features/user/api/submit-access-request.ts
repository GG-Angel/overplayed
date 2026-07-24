import { queueApi, type ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { queueUserStatusSchema, type QueueAccessRequest, type QueueUserStatus } from "@/lib/types";

const submitAccessRequest = async (form: QueueAccessRequest, token: string) => {
  return queueUserStatusSchema.parse(
    await queueApi.post("/queue", { ...form, "cf-turnstile-response": token })
  );
};

export const useSubmitAccessRequest = (form: QueueAccessRequest, token: string) => {
  const queryClient = useQueryClient();

  return useMutation<QueueUserStatus, AxiosError<ApiError>>({
    mutationFn: () => submitAccessRequest(form, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
