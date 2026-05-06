import type { SpotifyUser } from "@/types/api";
import { createContext, useContext } from "react";

interface UserContextValues {
  user: SpotifyUser | undefined;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  isLoggedIn: boolean;
}

export const UserContext = createContext<UserContextValues>({} as UserContextValues);

export const useUserContext = () => {
  return useContext(UserContext);
};
