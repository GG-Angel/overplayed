import { getQueueStatus } from "@/api/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const useQueueStatus = () => {
  return useQuery({
    queryFn: getQueueStatus,
    queryKey: queryKeys.queueStatus(),
    staleTime: 2 * 60 * 1000,
  });
};
