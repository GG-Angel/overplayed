import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { playlistMetadataSchema, type PlaylistMetadata } from "@/lib/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

const getPlaylistMetadata = async (playlistId: string): Promise<PlaylistMetadata> => {
  return playlistMetadataSchema.parse(await api.get(`/playlists/${playlistId}`));
};

const getPlaylistMetadataQueryOptions = (playlistId: string) => {
  return queryOptions({
    queryKey: queryKeys.playlists.one(playlistId),
    queryFn: () => getPlaylistMetadata(playlistId),
  });
};

export const usePlaylistMetadata = (playlistId: string) => {
  return useQuery(getPlaylistMetadataQueryOptions(playlistId));
};
