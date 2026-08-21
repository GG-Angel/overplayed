import { env } from "@/lib/env";
import { useAccessContext } from "../provider/AccessContext";
import { buildUrl } from "@/api/api-client";
import { useCurrentUser } from "@/api/queries";

const useAuth = () => {
  const { data: user, isLoading, isError } = useCurrentUser();
  const { setHasRequestedAccess } = useAccessContext();

  const isUnauthorized = user === null;

  const redirectToLogin = (currentPath: string) => {
    window.addEventListener("pagehide", () => {
      setHasRequestedAccess(true);
    });
    window.location.href = buildUrl(`${env.API_BASE_URL}/auth/login`, {
      redirect_to: currentPath,
    });
  };

  return {
    user,
    isLoading,
    isError,
    isUnauthorized,
    redirectToLogin,
  };
};

export default useAuth;
