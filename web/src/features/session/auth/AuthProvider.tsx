import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/storage";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children?: ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [hasRequestedAccess, setHasRequestedAccess] = useState(() =>
    loadFromStorage(localStorage, storageKeys.hasRequestedAccess, false)
  );

  const setHasRequestedAccessCallback = useCallback((value: boolean) => {
    saveToStorage(localStorage, storageKeys.hasRequestedAccess, value);
    setHasRequestedAccess(value);
  }, []);

  const contextValue = useMemo(
    () => ({ hasRequestedAccess, setHasRequestedAccess: setHasRequestedAccessCallback }),
    [hasRequestedAccess, setHasRequestedAccessCallback]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
