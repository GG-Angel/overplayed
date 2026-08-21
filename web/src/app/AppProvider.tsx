/// <reference types="vite-plugin-svgr/client" />

import { QUERY_CONFIG } from "@/api/queries";
import AccessProvider from "@/features/user/provider/AccessProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

type AppProviderProps = {
  children?: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: QUERY_CONFIG }));

  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools />}
      <AccessProvider>{children}</AccessProvider>
    </QueryClientProvider>
  );
};
