import { createContext, useContext } from "react";
import AuthProvider from "./AuthProvider";

export type AccessContextValues = {
  hasRequestedAccess: boolean;
  setHasRequestedAccess: (value: boolean) => void;
};

export const AuthContext = createContext<AccessContextValues | null>(null);

export const useAuthContext = (): AccessContextValues => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(`${useAuthContext.name} must be used inside an ${AuthProvider.name}`);
  }
  return context;
};
