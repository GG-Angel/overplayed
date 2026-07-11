import { queueApi, type ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { accessStatusSchema, type AccessRequest, type AccessStatus } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

const submitAccessRequest = async (form: AccessRequest) => {
  return accessStatusSchema.parse(await queueApi.post("/queue", form));
};

export const useSubmitAccessRequest = (form: AccessRequest) => {
  const queryClient = useQueryClient();

  return useMutation<AccessStatus, AxiosError<ApiError>>({
    mutationFn: () => submitAccessRequest(form),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKeys.userAccess(), data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
