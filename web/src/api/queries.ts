import {
  useQuery,
  type DefaultOptions,
  experimental_streamedQuery as streamedQuery,
  queryOptions,
  useQueries,
} from "@tanstack/react-query";
import {
  getAccessStatus,
  getCounters,
  getPlaylist,
  getQueueStatus,
  getLeaderboard,
  getCurrentUser,
  getUserStats,
  getPlaylists,
  getPlaylistTracks,
  getTrackPreview,
} from "./api";
import type { Track } from "@/types/spotify";

export const QUERY_CONFIG = {
  queries: {
    refetchOnWindowFocus: false,
    retry: false,
  },
} satisfies DefaultOptions;

export const QUERY_KEYS = {
  _users: () => ["users"] as const,
  user: () => [...QUERY_KEYS._users(), "current"] as const,
  userStats: () => [...QUERY_KEYS.user(), "stats"] as const,

  playlists: () => [...QUERY_KEYS.user(), "playlists"] as const,
  playlist: (playlistId: string | undefined) => [...QUERY_KEYS.playlists(), playlistId] as const,
  playlistTracks: (playlistId: string | undefined) =>
    [...QUERY_KEYS.playlist(playlistId), "tracks"] as const,
  trackPreview: (isrc: string | undefined) => ["preview", isrc] as const,

  _global: () => ["global"] as const,
  globalStats: () => [...QUERY_KEYS._global(), "stats"] as const,
  globalLeaderboard: () => [...QUERY_KEYS._global(), "leaderboard"] as const,
  globalCounters: () => [...QUERY_KEYS._global(), "counters"] as const,

  _queue: () => ["queue"] as const,
  queueStatus: () => [...QUERY_KEYS._queue(), "status"] as const,
  queueAccessStatus: (email: string | undefined) =>
    [...QUERY_KEYS._queue(), "access", email] as const,
} as const;

export const useCurrentUser = () =>
  useQuery({
    queryKey: QUERY_KEYS.user(),
    queryFn: getCurrentUser,
  });

export const usePlaylists = () => {
  const { isSuccess: isLoggedIn } = useCurrentUser();

  return useQuery({
    queryKey: QUERY_KEYS.playlists(),
    queryFn: getPlaylists,
    enabled: isLoggedIn,
  });
};

export const usePlaylist = (playlistId: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.playlist(playlistId),
    queryFn: () => {
      if (!playlistId) throw new Error("No playlistId provided.");
      return getPlaylist(playlistId);
    },
    enabled: Boolean(playlistId),
  });

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.playlistTracks(playlistId),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => {
        if (!playlistId) throw new Error("No playlistId provided.");
        return getPlaylistTracks(playlistId, signal);
      },
      reducer: (tracks, batch) => tracks.concat(batch),
      initialValue: [] as Track[],
    }),
    structuralSharing: false,
    enabled: Boolean(playlistId),
  });
};

export const useAccessStatus = (email: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.queueAccessStatus(email),
    queryFn: () => {
      if (!email) throw new Error("No email provided.");
      return getAccessStatus(email);
    },
    enabled: Boolean(email),
  });

export const useQueueStatus = () => {
  return useQuery({
    queryFn: getQueueStatus,
    queryKey: QUERY_KEYS.queueStatus(),
  });
};

export const useUserStats = () =>
  useQuery({
    queryKey: QUERY_KEYS.userStats(),
    queryFn: getUserStats,
  });

export const useLeaderboard = () =>
  useQuery({
    queryKey: QUERY_KEYS.globalLeaderboard(),
    queryFn: getLeaderboard,
  });

export const useCounters = () =>
  useQuery({
    queryKey: QUERY_KEYS.globalCounters(),
    queryFn: getCounters,
  });

const trackPreviewQueryOptions = (isrc: string | undefined) => {
  return queryOptions({
    queryKey: QUERY_KEYS.trackPreview(isrc),
    queryFn: () => {
      if (!isrc) throw new Error("No ISRC provided.");
      return getTrackPreview(isrc);
    },
    staleTime: ({ state }) => {
      if (!state.data?.expires_in) return 10 * 60 * 1000; // 10 minutes
      return state.data.expires_in * 1000; // expires_in is in secs, convert to ms
    },
    enabled: Boolean(isrc),
  });
};

export const useTrackPreview = (isrc: string | undefined) => {
  return useQuery(trackPreviewQueryOptions(isrc));
};

export const useTrackPreviews = (isrcs: (string | undefined)[]) => {
  return useQueries({
    queries: isrcs.map((isrc) => trackPreviewQueryOptions(isrc)),
    combine: (results) => ({
      urls: results
        .filter((p) => p.isSuccess)
        .map((p) => p.data.url)
        .filter((url) => url != null),
      isLoading: results.some((p) => p.isLoading),
    }),
  });
};
