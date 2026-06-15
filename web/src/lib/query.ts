import type { DefaultOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
  },
} satisfies DefaultOptions;

export const queryKeys = {
  user: ["user"] as const,
  metrics: ["metrics"] as const,
  leaderboard: ["leaderboard"] as const,
  preview: (isrc: string) => ["preview", isrc] as const,
  playlists: {
    all: ["playlists"] as const,
    metadata: (playlistId: string) => [...queryKeys.playlists.all, playlistId, "metadata"] as const,
    tracks: (playlistId: string) => [...queryKeys.playlists.all, playlistId, "tracks"] as const,
  },
} as const;
