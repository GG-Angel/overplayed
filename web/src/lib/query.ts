import type { DefaultOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
  },
} satisfies DefaultOptions;

export const queryKeys = {
  user: () => ["user"] as const,
  userProfile: () => [...queryKeys.user(), "profile"] as const,
  userAccess: () => [...queryKeys.user(), "access"] as const,

  queue: () => ["queue"] as const,
  queueStatus: () => [...queryKeys.queue(), "status"],

  metrics: () => ["metrics"] as const,
  metricsGlobal: () => [...queryKeys.metrics(), "global"] as const,
  metricsUser: () => [...queryKeys.metrics(), "user"] as const,
  metricsLeaderboard: () => [...queryKeys.metrics(), "leaderboard"] as const,

  playlists: () => ["playlists"] as const,
  playlistMetadata: (playlistId: string) =>
    [...queryKeys.playlists(), playlistId, "metadata"] as const,
  playlistTracks: (playlistId: string) => [...queryKeys.playlists(), playlistId, "tracks"] as const,

  trackPreview: (isrc: string) => ["preview", isrc] as const,
} as const;
