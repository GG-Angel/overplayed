import { useAuthContext } from "./AuthContext";
import { useCurrentUser } from "@/api/queries";
import { useCallback } from "react";
import { useLogout } from "@/api/mutations";
import { LOGIN_URL } from "@/lib/constants";

const useAuth = () => {
  const { data: user, isLoading, isError, isSuccess } = useCurrentUser();
  const { setHasRequestedAccess } = useAuthContext();

  const login = useCallback(() => {
    window.addEventListener("pagehide", () => {
      setHasRequestedAccess(true);
    });

    window.location.href = LOGIN_URL;
  }, [setHasRequestedAccess]);

  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const isUnauthorized = isSuccess && user === null;

  return { user, isLoading, isError, isUnauthorized, login, logout, isLoggingOut };
};

export default useAuth;
