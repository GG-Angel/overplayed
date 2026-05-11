import { get, post, routes } from "@/lib/api";
import type { SpotifyCurrentUser } from "@/lib/spotify/types";
import { useQuery } from "@tanstack/react-query";

const getUser = async () => await get<SpotifyCurrentUser>(routes.profile());

const useUser = () =>
  useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

const login = (redirectPath: string) => {
  window.location.href = routes.auth.login(redirectPath);
};

const logout = async () => {
  await post<void>(routes.auth.logout());
};

const useAuth = () => {
  const { data: user, ...rest } = useUser();
  return { user, ...rest, login, logout };
};

export default useAuth;
