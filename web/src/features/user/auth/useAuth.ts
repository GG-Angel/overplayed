import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { queryKeys } from "@/lib/query";
import { currentUserSchema } from "@/lib/types";
import api, { buildURLWithQueryParams } from "@/lib/api";

const getUser = async () => {
  try {
    return currentUserSchema.parse(await api.get("/users/me"));
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 401) return null;
    throw err;
  }
};

const logoutUser = async () => await api.post("/auth/logout");

const useUser = () =>
  useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: getUser,
    staleTime: 2 * 60 * 1000,
  });

const useAuth = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useUser();

  const isUnauthorized = user === null;

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const redirectToLogin = (currentPath: string) => {
    window.location.href = buildURLWithQueryParams(`${env.API_BASE_URL}/auth/login`, {
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
