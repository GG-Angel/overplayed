import { createContext, useContext } from "react";

export type AccessContextValues = {
  hasRequestedAccess: boolean;
  setHasRequestedAccess: (value: boolean) => void;
};

export const AccessContext = createContext<AccessContextValues | null>(null);

export const useAccessContext = (): AccessContextValues => {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useAccessContext must be used inside an AccessProvider");
  return context;
};
