import { getSwipeLeaderboard } from "@/api/api-service";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const useSwipeLeaderboard = () => {
  return useQuery({
    queryKey: queryKeys.metricsLeaderboard(),
    queryFn: getSwipeLeaderboard,
    staleTime: 2 * 60 * 1000,
  });
};
