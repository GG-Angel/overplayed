import api from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { globalMetricsSchema, userMetricsSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getGlobalSwipeMetrics = async () => {
  return globalMetricsSchema.parse(await api.get(`/metrics`));
};

export const useGlobalSwipeMetrics = () => {
  return useQuery({
    queryKey: queryKeys.metricsGlobal(),
    queryFn: getGlobalSwipeMetrics,
    staleTime: 2 * 60 * 1000,
  });
};

const getUserSwipeMetrics = async () => {
  return userMetricsSchema.parse(await api.get(`/metrics/me`));
};

export const useUserSwipeMetrics = () => {
  return useQuery({
    queryKey: queryKeys.metricsUser(),
    queryFn: getUserSwipeMetrics,
    staleTime: 2 * 60 * 1000,
  });
};
