import { queueApi } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { queueUserStatusSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getUserStatus = async (email: string) => {
  return queueUserStatusSchema.parse(
    await queueApi.get(`/queue/users/${encodeURIComponent(email)}`)
  );
};

export const useUserStatus = (email: string | undefined) => {
  return useQuery({
    queryKey: [...queryKeys.userAccess(), email],
    queryFn: () => {
      if (!email) throw new Error("No email provided");
      return getUserStatus(email);
    },
    enabled: !!email,
  });
};
