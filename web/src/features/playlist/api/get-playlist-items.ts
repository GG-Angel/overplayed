import { buildURLWithParams } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { playlistItemsPageSchema, type PlaylistItemsPage } from "@/lib/types";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";

const getPlaylistItems = async ({
  playlistId,
  page = 1,
}: {
  playlistId: string;
  page?: number;
}): Promise<PlaylistItemsPage> => {
  return playlistItemsPageSchema.parse(
    await api.get(buildURLWithParams(`/playlists/${playlistId}/items`, { page }))
  );
};

const getInfinitePlaylistItemsQueryOptions = (playlistId: string) => {
  return infiniteQueryOptions({
    queryKey: queryKeys.playlists.tracks(playlistId),
    queryFn: ({ pageParam }) => getPlaylistItems({ playlistId, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      const nextPage = allPages.length;
      return nextPage;
    },
    initialPageParam: 0,
  });
};

export const useInfinitePlaylistItems = (playlistId: string) => {
  return useInfiniteQuery({
    ...getInfinitePlaylistItemsQueryOptions(playlistId),
  });
};
