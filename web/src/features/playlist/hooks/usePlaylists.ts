import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { playlistMetadataSchema } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import z from "zod";

const getPlaylists = async () => {
  const response = await api.get("/playlists");
  return z.array(playlistMetadataSchema).parse(response);
};

const playlistsOptions = queryOptions({
  queryKey: queryKeys.playlists.all,
  queryFn: getPlaylists,
});

export const usePlaylists = () => useQuery(playlistsOptions);
