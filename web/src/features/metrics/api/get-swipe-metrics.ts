import api from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { globalMetricsSchema, userMetricsSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getGlobalSwipeMetrics = async () => {
  return globalMetricsSchema.parse(await api.get(`/metrics`));
};

const getUserSwipeMetrics = async () => {
  return userMetricsSchema.parse(await api.get(`/metrics/me`));
};

const getGlobalSwipeMetricQueryOptions = () => {
  return queryOptions({
    queryKey: queryKeys.metrics,
    queryFn: getGlobalSwipeMetrics,
    staleTime: 2 * 60 * 1000,
  });
};

const getUserSwipeMetricQueryOptions = () => {
  return queryOptions({
    queryKey: queryKeys.userStats(),
    queryFn: getUserSwipeMetrics,
    staleTime: 2 * 60 * 1000,
  });
};

export const useGlobalSwipeMetrics = () => {
  return useQuery(getGlobalSwipeMetricQueryOptions());
};

export const useUserSwipeMetrics = () => {
  return useQuery(getUserSwipeMetricQueryOptions());
};
