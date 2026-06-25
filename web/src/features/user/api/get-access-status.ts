import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { accessStatusSchema, type AccessRequest } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getAccessStatus = async (form: AccessRequest) => {
  return accessStatusSchema.parse(await queueApi.post("/status", form));
};

export const useAccessStatus = (form: AccessRequest) => {
  return useQuery({
    queryFn: () => getAccessStatus(form),
    queryKey: queryKeys.userAccess(),
    staleTime: 30 * 1000,
    enabled: false,
  });
};
