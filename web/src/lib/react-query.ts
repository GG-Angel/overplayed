import type { DefaultOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    throwOnError: true, // TODO: remove in production
    refetchOnWindowFocus: false,
    retry: false,
  },
} satisfies DefaultOptions;
