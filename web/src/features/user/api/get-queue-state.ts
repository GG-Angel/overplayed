import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { queueStatusSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getQueueState = async () => {
  return queueStatusSchema.parse(await queueApi.get("/queue"));
};

const getQueueStateQueryOptions = () => {
  return queryOptions({
    queryFn: getQueueState,
    queryKey: queryKeys.queue.status,
    staleTime: 2 * 60 * 1000,
  });
};

export const useQueueState = () => {
  return useQuery(getQueueStateQueryOptions());
};
