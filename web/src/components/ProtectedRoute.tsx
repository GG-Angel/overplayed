import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import { useAuth } from "@/hooks/auth";

export const ProtectedRoute = () => {
  const { user, isLoading, isError, isUnauthorized, redirectToLogin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isUnauthorized) redirectToLogin(location.pathname);
  }, [isUnauthorized, location.pathname, redirectToLogin]);

  if (isLoading || isUnauthorized) return <LoadingState />;
  if (isError) return <ErrorState message="Login required" />;
  if (!user) return <LoadingState />;

  return <Outlet />;
};
