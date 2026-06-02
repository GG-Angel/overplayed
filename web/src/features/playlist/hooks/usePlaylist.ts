import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { playlistSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getPlaylist = async (playlistId: string) => {
  const response = await api.get(`/playlists/${playlistId}`);
  return playlistSchema.parse(response);
};

const playlistOptions = (playlistId: string) =>
  queryOptions({
    queryKey: queryKeys.playlists.one(playlistId),
    queryFn: () => getPlaylist(playlistId),
  });

export const usePlaylist = (playlistId: string) => useQuery(playlistOptions(playlistId));
