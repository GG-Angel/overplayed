import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { queueUserStatusSchema, type QueueAccessRequest } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getAccessStatus = async (form: QueueAccessRequest) => {
  return queueUserStatusSchema.parse(await queueApi.get(`/queue/${form.email}`));
};

export const useCheckAccessStatus = (form: QueueAccessRequest) => {
  return useQuery({
    queryFn: () => getAccessStatus(form),
    queryKey: queryKeys.userAccess(),
    staleTime: 30 * 1000,
    enabled: false,
  });
};
