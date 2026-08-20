import { useQuery } from "@tanstack/react-query";
import {
  globalMetricsSchema,
  leaderboardSchema,
  userMetricsSchema,
} from "../types";
import api, { queryKeys } from "./client";

export const useGlobalSwipeMetrics = () =>
  useQuery({
    queryKey: queryKeys.metricsGlobal(),
    queryFn: async () => globalMetricsSchema.parse(await api.get("/stats")),
    staleTime: 2 * 60 * 1000,
  });

export const useUserSwipeMetrics = () =>
  useQuery({
    queryKey: queryKeys.metricsUser(),
    queryFn: async () => userMetricsSchema.parse(await api.get("/stats/me")),
    staleTime: 2 * 60 * 1000,
  });

export const useSwipeLeaderboard = () =>
  useQuery({
    queryKey: queryKeys.metricsLeaderboard(),
    queryFn: async () => leaderboardSchema.parse(await api.get("/users/leaderboard")),
    staleTime: 2 * 60 * 1000,
  });
