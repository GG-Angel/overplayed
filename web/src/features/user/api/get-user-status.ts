import { getAccessStatus as getAccessStatus } from "@/api/api-service";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const useAccessStatus = (email: string | undefined) => {
  return useQuery({
    queryKey: [...queryKeys.userAccess(), email],
    queryFn: () => {
      if (!email) throw new Error("No email provided.");
      return getAccessStatus(email);
    },
    enabled: !!email,
  });
};
