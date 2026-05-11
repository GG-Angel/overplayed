import { Outlet, useLocation } from "react-router-dom";
import { isAxiosError } from "axios";
import { routes } from "@/lib/api";
import { useEffect } from "react";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import useAuth from "./useAuth";

export const ProtectedRoute = () => {
  const { isLoading, isError, error } = useAuth();
  const location = useLocation();

  const status = isAxiosError(error) ? error.response?.status : null;

  useEffect(() => {
    if (status === 401) {
      window.location.href = routes.auth.login(location.pathname);
    }
  }, [status, location.pathname]);

  if (isLoading || status === 401) return <LoadingState />;
  if (isError) return <ErrorState />;

  return <Outlet />;
};
