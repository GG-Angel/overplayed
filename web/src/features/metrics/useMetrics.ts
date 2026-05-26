import { getMetrics } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

const useMetrics = () =>
  useQuery({
    queryKey: queryKeys.metrics,
    queryFn: getMetrics,
  });

export default useMetrics;
