import { api, routes } from "@/lib/api-client";
import type { SpotifyCurrentUser } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { UserContext } from "./context";

const useUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<SpotifyCurrentUser> => {
      const response = await api.get(routes.profile());
      return response.data;
    },
    staleTime: Infinity,
  });

type UserProviderProps = {
  children: ReactNode;
};

const UserProvider = ({ children }: UserProviderProps) => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isSuccess } = useUser();

  const logoutMutation = useMutation({
    onSuccess: () => queryClient.clear(),
    mutationFn: async (): Promise<void> => {
      await api.post(routes.auth.logout());
    },
  });

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: isSuccess && !!user,
        login: routes.auth.login,
        logout: () => logoutMutation.mutate(),
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
