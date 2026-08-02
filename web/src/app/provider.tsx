/// <reference types="vite-plugin-svgr/client" />

import AccessProvider from "@/features/user/provider/AccessProvider";
import { queryConfig } from "@/lib/query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

type AppProviderProps = {
  children?: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: queryConfig }));

  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools />}
      <AccessProvider>{children}</AccessProvider>
    </QueryClientProvider>
  );
};
