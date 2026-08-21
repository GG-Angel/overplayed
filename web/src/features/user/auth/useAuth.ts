import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { queryKeys } from "@/lib/query";
import { useAccessContext } from "../provider/AccessContext";
import { currentUserSchema } from "@/types/spotify";
import { serverApi, buildUrl } from "@/api/api-client";

const getUser = async () => {
  try {
    return currentUserSchema.parse(await serverApi.get("/users/me"));
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 401) return null;
    throw err;
  }
};

const logoutUser = async () => await serverApi.post("/auth/logout");

const useUser = () =>
  useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: getUser,
    staleTime: 2 * 60 * 1000,
  });

const useAuth = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useUser();
  const { setHasRequestedAccess } = useAccessContext();

  const isUnauthorized = user === null;

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onMutate: () => {
      queryClient.clear();
    },
  });

  const redirectToLogin = (currentPath: string) => {
    window.addEventListener("pagehide", () => {
      setHasRequestedAccess(true);
    });
    window.location.href = buildUrl(`${env.API_BASE_URL}/auth/login`, {
      redirect_to: currentPath,
    });
  };

  return {
    user,
    isLoading,
    isError,
    isUnauthorized,
    redirectToLogin,
    logoutMutation,
  };
};

export default useAuth;
