/// <reference types="vite-plugin-svgr/client" />

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { queryConfig } from "../api/client";
import { AccessProvider } from "./auth";

export const AppProviders = ({ children }: { children?: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: queryConfig }));
  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools />}
      <AccessProvider>{children}</AccessProvider>
    </QueryClientProvider>
  );
};
