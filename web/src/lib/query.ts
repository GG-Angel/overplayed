import type { DefaultOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
  },
} satisfies DefaultOptions;

export const queryKeys = {
  user: ["user"],
  playlists: {
    all: ["playlists"],
    one: (id: string) => [...queryKeys.playlists.all, id],
    tracks: (id: string) => [...queryKeys.playlists.one(id), "tracks"],
  },
} as const;
