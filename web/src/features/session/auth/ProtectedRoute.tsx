import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import useAuth from "./useAuth";

export const ProtectedRoute = () => {
  const { user, isUnauthorized, login } = useAuth();

  useEffect(() => {
    if (isUnauthorized) login();
  }, [isUnauthorized, login]);

  if (user.isError) return <ErrorState message="Login required" />;
  if (!user.isSuccess) return <LoadingState message="Verifying user..." />;
  if (isUnauthorized) return <LoadingState message="Redirecting to login..." />;

  return <Outlet />;
};
