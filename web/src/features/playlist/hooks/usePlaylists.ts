import { getPlaylists } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";

export const usePlaylists = () =>
  useQuery({
    queryKey: queryKeys.playlists.all,
    queryFn: getPlaylists,
  });
