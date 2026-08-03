import api, { buildURLWithQueryParams } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { playlistPageSchema, type PlaylistPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const getPlaylistTracks = async ({
  playlistId,
  offset = 0,
}: {
  playlistId: string;
  offset?: number;
}): Promise<PlaylistPage> => {
  return playlistPageSchema.parse(
    await api.get(buildURLWithQueryParams(`/playlists/${playlistId}/tracks`, { offset }))
  );
};

export const usePlaylistTracks = (playlistId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: queryKeys.playlistTracks(playlistId!),
    queryFn: ({ pageParam }) => getPlaylistTracks({ playlistId: playlistId!, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.next_offset,
    initialPageParam: 0,
    retry: 3,
    enabled: !!playlistId,
  });
};
