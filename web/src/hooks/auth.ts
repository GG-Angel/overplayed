import { isAxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser } from "@/lib/api";
import api from "@/lib/api-client";
import { env } from "@/lib/env";

const redirectToLogin = (currentPath: string) => {
  window.location.href = `${env.API_BASE_URL}/auth/login?${new URLSearchParams({
    redirect_to: currentPath,
  })}`;
};

export const useAuth = () => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    retry: (failureCount, err) => {
      // don't retry 401s, they're expected for logged-out users
      if (isAxiosError(err) && err.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  const isUnauthorized = isAxiosError(error) && error.response?.status === 401;

  const logout = async () => {
    await api.post("/auth/logout");
    queryClient.setQueryData(["user"], null);
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "user" });
  };

  return {
    user,
    isLoading,
    isError: isError && !isUnauthorized,
    isUnauthorized,
    redirectToLogin,
    logout,
  };
};
