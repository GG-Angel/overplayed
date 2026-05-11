import { useUserContext } from "@/context/UserContext";
import { Outlet, useLocation } from "react-router-dom";
import { isAxiosError } from "axios";
import { routes } from "@/lib/api-client";
import { useEffect } from "react";
import { LoadingPage } from "@/app/pages/loading";
import { ErrorPage } from "@/app/pages/error";

export const ProtectedRoute = () => {
  const { isLoading, isError, error } = useUserContext();
  const location = useLocation();

  const status = isAxiosError(error) ? error.response?.status : null;

  useEffect(() => {
    if (status === 401) {
      window.location.href = routes.auth.login(location.pathname);
    }
  }, [status, location.pathname]);

  if (isLoading || status === 401) return <LoadingPage />;
  if (isError) return <ErrorPage />;

  return <Outlet />;
};
