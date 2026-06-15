import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { swipeLeaderboardSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getSwipeLeaderboard = async () => {
  return swipeLeaderboardSchema.parse(await api.get("/users/leaderboard"));
};

const getSwipeLeaderboardQueryOptions = () => {
  return queryOptions({
    queryKey: queryKeys.leaderboard,
    queryFn: getSwipeLeaderboard,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSwipeLeaderboard = () => {
  return useQuery(getSwipeLeaderboardQueryOptions());
};
