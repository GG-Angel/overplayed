import api from "@/lib/api-client";
import { isAxiosError } from "axios";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { queryKeys } from "@/lib/query";
import { currentUserSchema } from "@/lib/types";
import { buildURLWithParams } from "@/lib/api";

const getUser = async () => currentUserSchema.parse(await api.get("/users/me"));

const logoutUser = async () => await api.post("/auth/logout");

const userOptions = queryOptions({
  queryKey: queryKeys.user,
  queryFn: getUser,
  retry: (failureCount, err) => {
    // don't retry 401s, they're expected for logged-out users
    if (isAxiosError(err) && err.response?.status === 401) return false;
    return failureCount < 3;
  },
  staleTime: 2 * 60 * 1000,
});

const useUser = () => useQuery(userOptions);

const useAuth = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, error } = useUser();

  const isUnauthorized = isAxiosError(error) && error.response?.status === 401;

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const redirectToLogin = (currentPath: string) => {
    window.location.href = buildURLWithParams(`${env.API_BASE_URL}/auth/login`, {
      redirectTo: currentPath,
    });
  };

  return {
    user,
    isLoading,
    isError: isError && !isUnauthorized,
    isUnauthorized,
    redirectToLogin,
    logoutMutation,
  };
};

export default useAuth;
