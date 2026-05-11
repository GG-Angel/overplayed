import type { SpotifyCurrentUser } from "@/types/api";
import { createContext, useContext } from "react";

interface UserContextValues {
  user: SpotifyCurrentUser | undefined;
  login: (currentPathname: string) => void;
  logout: () => void;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export const UserContext = createContext<UserContextValues | null>(null);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within a UserProvider");
  return context;
};
