import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { accessResponseSchema, type AccessRequest } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const submitAccessRequest = async (form: AccessRequest) => {
  return accessResponseSchema.parse(await queueApi.post("/queue", form));
};

export const useSubmitAccessRequest = (form: AccessRequest) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => submitAccessRequest(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.queue.status });
    },
  });
};
