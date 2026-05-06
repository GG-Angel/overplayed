import { UserContext } from "./UserContext";
import { useQuery } from "@tanstack/react-query";
import { api, routes } from "@/lib/api-client";
import type { SpotifyCurrentUser } from "@/types/api";
import type { ReactNode } from "react";

const getUser = async (): Promise<SpotifyCurrentUser> => {
  return await api.get(routes.profile());
};

const useUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: Infinity,
  });

const login = () => {
  window.location.href = routes.auth.login(location.pathname);
};

const logout = async (): Promise<void> => {
  await api.post(routes.auth.logout());
};

type UserProviderProps = {
  children: ReactNode;
};

const UserProvider = ({ children }: UserProviderProps) => {
  const { data: user, isLoading, isError, error } = useUser();
  return (
    <UserContext.Provider value={{ user, isLoading, isError, error, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
