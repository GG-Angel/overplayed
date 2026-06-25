import api from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { playlistSchema } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import z from "zod";

const getUserPlaylists = async () => {
  return z.array(playlistSchema).parse(await api.get("/playlists"));
};

export const useUserPlaylists = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.playlists(),
    queryFn: getUserPlaylists,
    enabled: options?.enabled,
  });
};
