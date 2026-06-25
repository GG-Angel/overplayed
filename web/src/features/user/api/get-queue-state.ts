import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { queueStatusSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getQueueStatus = async () => {
  return queueStatusSchema.parse(await queueApi.get("/queue"));
};

export const useQueueStatus = () => {
  return useQuery({
    queryFn: getQueueStatus,
    queryKey: queryKeys.queueStatus(),
    staleTime: 2 * 60 * 1000,
  });
};
