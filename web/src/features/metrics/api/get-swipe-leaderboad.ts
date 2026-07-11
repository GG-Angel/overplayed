import api from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { leaderboardSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getSwipeLeaderboard = async () => {
  return leaderboardSchema.parse(await api.get("/users/leaderboard"));
};

export const useSwipeLeaderboard = () => {
  return useQuery({
    queryKey: queryKeys.metricsLeaderboard(),
    queryFn: getSwipeLeaderboard,
    staleTime: 2 * 60 * 1000,
  });
};
