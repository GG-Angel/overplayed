import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { accessStatusSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getAccessStatus = async () => {
  return accessStatusSchema.parse(await queueApi.get("/status"));
};

export const useAccessStatus = () => {
  return useQuery({
    queryFn: getAccessStatus,
    queryKey: queryKeys.userAccess(),
    staleTime: 30 * 1000,
  });
};
