import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { queueUserStatusSchema } from "@/lib/types";

const getUserStatus = async (email: string) => {
  return queueUserStatusSchema.parse(await queueApi.get(`/queue/${encodeURIComponent(email)}`));
};

export const useUserStatus = (email: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.userAccess(),
    queryFn: () => getUserStatus(email!),
    enabled: !!email,
    staleTime: 2 * 60 * 1000,
  });
};
