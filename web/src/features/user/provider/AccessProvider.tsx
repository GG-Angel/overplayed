import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/storage";
import { useMemo, useState, type ReactNode } from "react";
import { AccessContext } from "./AccessContext";
import useAuth from "../auth/useAuth";

const AccessProvider = ({ children }: { children?: ReactNode }) => {
  const { isUnauthorized } = useAuth();

  const [hasInteractedWithAuth, setHasInteractedWithAuth] = useState(() =>
    loadFromStorage(localStorage, storageKeys.hasRequestedAccess, false)
  );

  if (!hasInteractedWithAuth && !isUnauthorized) {
    saveToStorage(localStorage, storageKeys.hasRequestedAccess, true);
    setHasInteractedWithAuth(true);
  }

  const contextValue = useMemo(
    () => ({
      hasRequestedAccess: hasInteractedWithAuth,
      setHasRequestedAccess: (value: boolean) => {
        saveToStorage(localStorage, storageKeys.hasRequestedAccess, value);
        setHasInteractedWithAuth(value);
      },
    }),
    [hasInteractedWithAuth]
  );

  return <AccessContext.Provider value={contextValue}>{children}</AccessContext.Provider>;
};

export default AccessProvider;
