import { Outlet } from "react-router-dom";
import { useEffect, useMemo } from "react";
import ErrorState from "@/components/states/ErrorState";
import LoadingState from "@/components/states/LoadingState";
import useAuth from "./useAuth";
import { ProtectedContext } from "./ProtectedContext";

export const ProtectedRoute = () => {
  const { user, isError, isLoading, isUnauthorized, login } = useAuth();

  const contextValue = useMemo(() => {
    if (!user) return null;
    return { user };
  }, [user]);

  useEffect(() => {
    if (isUnauthorized) login();
  }, [isUnauthorized, login]);

  if (isError) return <ErrorState message="Login required" />;
  if (isLoading) return <LoadingState message="Verifying user..." />;
  if (isUnauthorized) return <LoadingState message="Redirecting to login..." />;
  if (!user) return <LoadingState message="Loading user..." />;

  return (
    <ProtectedContext.Provider value={contextValue}>
      <Outlet />
    </ProtectedContext.Provider>
  );
};
