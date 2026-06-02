import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { metricsSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getMetrics = async () => {
  const response = await api.get(`/metrics/summary`);
  return metricsSchema.parse(response);
};

const metricOptions = queryOptions({
  queryKey: queryKeys.metrics,
  queryFn: getMetrics,
  staleTime: 2 * 60 * 1000,
});

const useMetrics = () => useQuery(metricOptions);

export default useMetrics;
