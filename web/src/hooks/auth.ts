import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/api";
import api from "@/lib/api-client";
import { env } from "@/lib/env";

const redirectToLogin = (currentPath: string) => {
  window.location.href = `${env.API_URL}/auth/login?${new URLSearchParams({
    redirect_to: currentPath,
  })}`;
};

const logout = async () => {
  await api.post("/auth/logout");
};

export const useAuth = () => {
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
      return failureCount < 3;
    },
  });

  const isUnauthorized = isAxiosError(error) && error.response?.status === 401;

  return {
    user,
    isLoading,
    isError: isError && !isUnauthorized,
    isUnauthorized,
    redirectToLogin,
    logout,
  };
};
