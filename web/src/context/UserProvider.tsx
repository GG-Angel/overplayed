import { UserContext } from "./UserContext";
import { useQuery } from "@tanstack/react-query";
import { get, post, routes } from "@/lib/api-client";
import type { SpotifyCurrentUser } from "@/types/api";
import type { ReactNode } from "react";

const getUser = async () => await get<SpotifyCurrentUser>(routes.profile());

const useUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

const login = (currentPathname: string) => {
  window.location.href = routes.auth.login(currentPathname);
};

const logout = async () => {
  await post<void>(routes.auth.logout());
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
