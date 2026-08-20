/* eslint-disable react-refresh/only-export-components */
import { isAxiosError } from "axios";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useLocation } from "react-router-dom";
import api, { buildURLWithQueryParams, queryKeys } from "../api/client";
import { currentUserSchema } from "../types";
import { env } from "../env";
import { loadFromStorage, saveToStorage, storageKeys } from "../storage";
import { ErrorState, LoadingState } from "../components/PageState";

type AccessContextValues = {
  hasRequestedAccess: boolean;
  setHasRequestedAccess: (value: boolean) => void;
};

const AccessContext = createContext<AccessContextValues | null>(null);

export const useAccess = (): AccessContextValues => {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useAccess must be used inside an AccessProvider");
  return context;
};

export const AccessProvider = ({ children }: { children?: ReactNode }) => {
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

const getUser = async () => {
  try {
    return currentUserSchema.parse(await api.get("/users/me"));
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) return null;
    throw error;
  }
};

const useAuth = () => {
  const queryClient = useQueryClient();
  const { setHasRequestedAccess } = useAccess();
  const { data: user, isLoading, isError } = useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: getUser,
    staleTime: 2 * 60 * 1000,
  });
  const logoutMutation = useMutation({
    mutationFn: async () => await api.post("/auth/logout"),
    onMutate: () => queryClient.clear(),
  });
  const redirectToLogin = (currentPath: string) => {
    window.addEventListener("pagehide", () => setHasRequestedAccess(true));
    window.location.href = buildURLWithQueryParams(`${env.API_BASE_URL}/auth/login`, {
      redirect_to: currentPath,
    });
  };
  return {
    user,
    isLoading,
    isError,
    isUnauthorized: user === null,
    redirectToLogin,
    logoutMutation,
  };
};

export const ProtectedRoute = () => {
  const { user, isLoading, isError, isUnauthorized, redirectToLogin } = useAuth();
  const location = useLocation();
  useEffect(() => {
    if (isUnauthorized) redirectToLogin(location.pathname);
  }, [isUnauthorized, location.pathname, redirectToLogin]);
  if (isLoading || isUnauthorized) return <LoadingState message="Verifying login..." />;
  if (isError) return <ErrorState message="Login required" />;
  if (!user) return <LoadingState message="Loading user..." />;
  return <Outlet />;
};

export default useAuth;
