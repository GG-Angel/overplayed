import { getGlobalSwipeStats as getGlobalSwipeStats, getSwipeStats } from "@/api/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const useGlobalSwipeStats = () => {
  return useQuery({
    queryKey: queryKeys.metricsGlobal(),
    queryFn: getGlobalSwipeStats,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSwipeStats = () => {
  return useQuery({
    queryKey: queryKeys.metricsUser(),
    queryFn: getSwipeStats,
    staleTime: 2 * 60 * 1000,
  });
};
