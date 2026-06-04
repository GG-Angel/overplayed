import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { metricsSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getMetrics = async () => {
  return metricsSchema.parse(await api.get(`/metrics/summary`));
};

const getMetricQueryOptions = () => {
  return queryOptions({
    queryKey: queryKeys.metrics,
    queryFn: getMetrics,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMetrics = () => {
  return useQuery(getMetricQueryOptions());
};
