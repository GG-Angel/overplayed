import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { playlistSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import z from "zod";

const getUserPlaylists = async () => {
  return z.array(playlistSchema).parse(await api.get("/playlists"));
};

const getUserPlaylistsOptions = () => {
  return queryOptions({
    queryKey: queryKeys.playlists.all,
    queryFn: getUserPlaylists,
  });
};

export const useUserPlaylists = () => {
  return useQuery(getUserPlaylistsOptions());
};
