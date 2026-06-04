import { buildURLWithParams } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { playlistItemsPageSchema, type PlaylistItemsPage } from "@/lib/types";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { useEffect } from "react";

const PAGE_SIZE = 100;
const PREFETCH_THRESHOLD = 20;

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

const useInfinitePlaylistItems = (playlistId: string) => {
  return useInfiniteQuery({
    ...getInfinitePlaylistItemsQueryOptions(playlistId),
  });
};

export const usePrefetchedPlaylistItems = (playlistId: string, index: number) => {
  const items = useInfinitePlaylistItems(playlistId);

  const { isSuccess, hasNextPage, isFetchingNextPage, fetchNextPage, data } = items;

  useEffect(() => {
    if (!isSuccess || !hasNextPage || isFetchingNextPage) return;

    const totalItemsLoaded = data.pages.length * PAGE_SIZE;
    if (index >= totalItemsLoaded - PREFETCH_THRESHOLD) {
      fetchNextPage();
    }
  }, [isSuccess, hasNextPage, isFetchingNextPage, fetchNextPage, data, index]);

  return items;
};
