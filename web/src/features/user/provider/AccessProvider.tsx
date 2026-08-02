import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/storage";
import { useMemo, useState, type ReactNode } from "react";
import { AccessContext } from "./AccessContext";

const AccessProvider = ({ children }: { children?: ReactNode }) => {
  const [hasRequestedAccess, setHasRequestedAccess] = useState(() =>
    loadFromStorage(localStorage, storageKeys.hasRequestedAccess, false)
  );

  const contextValue = useMemo(
    () => ({
      hasRequestedAccess,
      setHasRequestedAccess: (value: boolean) => {
        saveToStorage(localStorage, storageKeys.hasRequestedAccess, value);
        setHasRequestedAccess(value);
      },
    }),
    [hasRequestedAccess]
  );

  return <AccessContext.Provider value={contextValue}>{children}</AccessContext.Provider>;
};

export default AccessProvider;
