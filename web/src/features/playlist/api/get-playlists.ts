import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { playlistMetadataSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import z from "zod";

const getUserPlaylists = async () => {
  return z.array(playlistMetadataSchema).parse(await api.get("/playlists"));
};

const getUserPlaylistsQueryOptions = () => {
  return queryOptions({
    queryKey: queryKeys.playlists.all,
    queryFn: getUserPlaylists,
  });
};

export const useUserPlaylists = () => {
  return useQuery(getUserPlaylistsQueryOptions());
};
