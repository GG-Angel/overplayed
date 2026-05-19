import type { DefaultOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
  },
} satisfies DefaultOptions;

export const queryKeys = {
  user: ["user"],
  preview: (isrc: string) => ["preview", isrc],
  playlists: {
    all: ["playlists"],
    one: (playlistId: string) => [...queryKeys.playlists.all, playlistId],
    tracks: (playlistId: string) => [...queryKeys.playlists.one(playlistId), "tracks"],
  },
} as const;
