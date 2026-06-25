import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { accessStatusSchema, type AccessRequest } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const submitAccessRequest = async (form: AccessRequest) => {
  return accessStatusSchema.parse(await queueApi.post("/queue", form));
};

export const useSubmitAccessRequest = (form: AccessRequest) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitAccessRequest(form),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
