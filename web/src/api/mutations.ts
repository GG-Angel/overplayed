import type { AccessRequestForm } from "@/types/queue";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postAccessRequest, postLogout } from "./api";
import { QUERY_KEYS } from "./queries";

export const useRequestAccess = (form: AccessRequestForm, turnstileToken: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postAccessRequest(form, turnstileToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.queueStatus() });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLogout,
    onMutate: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(), refetchType: "none" });
    },
  });
};
