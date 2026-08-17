import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { queueOverviewSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getQueueOverview = async () => {
  return queueOverviewSchema.parse(await queueApi.get("/queue/overview"));
};

export const useQueueOverview = () => {
  return useQuery({
    queryFn: getQueueOverview,
    queryKey: queryKeys.queueStatus(),
    staleTime: 2 * 60 * 1000,
  });
};
