import { queueApi, type ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { queueUserStatusSchema, type QueueAccessRequest, type QueueUserStatus } from "@/lib/types";
import useLocalStorage, { localStorageConfig } from "@/hooks/useLocalStorage";

const submitAccessRequest = async (form: QueueAccessRequest, turnstileToken: string) => {
  return queueUserStatusSchema.parse(
    await queueApi.post("/queue", { ...form, "cf-turnstile-response": turnstileToken })
  );
};

export const useSubmitAccessRequest = (form: QueueAccessRequest, turnstileToken: string) => {
  const queryClient = useQueryClient();
  const [, setHasRequestedAccess] = useLocalStorage<boolean>(
    localStorageConfig.hasRequestedAccess.key,
    localStorageConfig.hasRequestedAccess.default
  );

  return useMutation<QueueUserStatus, AxiosError<ApiError>>({
    mutationFn: () => submitAccessRequest(form, turnstileToken),
    onSuccess: async () => {
      setHasRequestedAccess(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
