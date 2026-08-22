import type { CurrentUser } from "@/types/spotify";
import { createContext, useContext } from "react";

type ProtectedRouteContext = {
  user: CurrentUser;
};

export const ProtectedContext = createContext<ProtectedRouteContext | null>(null);

export const useProtectedContext = () => {
  const context = useContext(ProtectedContext);
  if (!context) {
    throw new Error(
      `${useProtectedContext.name} must be used inside a ${ProtectedContext.Provider.name}`
    );
  }
  return context;
};
