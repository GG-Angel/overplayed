import { queueApi, type ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { queueUserStatusSchema, type QueueAccessRequest, type QueueUserStatus } from "@/lib/types";

const submitAccessRequest = async (form: QueueAccessRequest) => {
  return queueUserStatusSchema.parse(await queueApi.post("/queue", form));
};

export const useSubmitAccessRequest = (form: QueueAccessRequest) => {
  const queryClient = useQueryClient();

  return useMutation<QueueUserStatus, AxiosError<ApiError>>({
    mutationFn: () => submitAccessRequest(form),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.resetQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
