import api from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { playlistSchema, type Playlist } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getPlaylist = async (playlistId: string): Promise<Playlist> => {
  return playlistSchema.parse(await api.get(`/playlists/${playlistId}`));
};

export const usePlaylist = (playlistId: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.playlistMetadata(playlistId!),
    queryFn: () => getPlaylist(playlistId!),
    enabled: !!playlistId,
  });
};
