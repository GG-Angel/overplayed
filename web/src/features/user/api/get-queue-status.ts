import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { queueStatusSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getQueueStatus = async () => {
  return queueStatusSchema.parse(await queueApi.get("/queue"));
};

const getQueueStatusQueryOptions = () => {
  return queryOptions({
    queryFn: getQueueStatus,
    queryKey: queryKeys.queue.status,
    staleTime: 60 * 1000,
  });
};

export const useQueueStatus = () => {
  return useQuery(getQueueStatusQueryOptions());
};
