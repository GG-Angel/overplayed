/// <reference types="vite-plugin-svgr/client" />

import UserProvider from "@/context/UserProvider";
import { queryConfig } from "@/lib/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense, useState, type ReactNode } from "react";

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: queryConfig }));

  return (
    <Suspense>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          {import.meta.env.DEV && <ReactQueryDevtools />}
          {children}
        </UserProvider>
      </QueryClientProvider>
    </Suspense>
  );
};
