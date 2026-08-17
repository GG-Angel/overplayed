import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { queueUserAccessSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../auth/useAuth";

const getUserStatus = async (email: string) => {
  return queueUserAccessSchema.parse(await queueApi.get(`/queue/${encodeURIComponent(email)}`));
};

export const useUserStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.userAccess(),
    queryFn: () => getUserStatus(user!.email),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
};
