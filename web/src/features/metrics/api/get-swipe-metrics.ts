import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { globalSwipeMetricsSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getGlobalSwipeMetrics = async () => {
  return globalSwipeMetricsSchema.parse(await api.get(`/metrics`));
};

const getGlobalSwipeMetricQueryOptions = () => {
  return queryOptions({
    queryKey: queryKeys.metrics,
    queryFn: getGlobalSwipeMetrics,
    staleTime: 2 * 60 * 1000,
  });
};

export const useGlobalSwipeMetrics = () => {
  return useQuery(getGlobalSwipeMetricQueryOptions());
};
