import { buildURLWithParams } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { playlistPageSchema, type PlaylistPage } from "@/lib/types";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { useEffect } from "react";

const getPlaylistItems = async ({
  playlistId,
  offset = 0,
}: {
  playlistId: string;
  offset?: number;
}): Promise<PlaylistPage> => {
  return playlistPageSchema.parse(
    await api.get(buildURLWithParams(`/playlists/${playlistId}/items`, { offset }))
  );
};

const getInfinitePlaylistItemsQueryOptions = (playlistId: string) => {
  return infiniteQueryOptions({
    queryKey: queryKeys.playlists.tracks(playlistId),
    queryFn: ({ pageParam }) => getPlaylistItems({ playlistId, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.metadata.next_offset,
    initialPageParam: 0,
  });
};

const useInfinitePlaylistItems = (playlistId: string) => {
  return useInfiniteQuery({
    ...getInfinitePlaylistItemsQueryOptions(playlistId),
  });
};

const PREFETCH_THRESHOLD = 20;

export const usePrefetchedPlaylistItems = (playlistId: string, index: number) => {
  const items = useInfinitePlaylistItems(playlistId);
  const { isSuccess, hasNextPage, isFetchingNextPage, fetchNextPage, data } = items;

  const loadedCount = data?.pages.reduce((acc, curr) => acc + curr.items.length, 0) ?? 0;

  useEffect(() => {
    if (!isSuccess || !hasNextPage || isFetchingNextPage) return;

    if (index >= loadedCount - PREFETCH_THRESHOLD) {
      fetchNextPage();
    }
  }, [isSuccess, hasNextPage, isFetchingNextPage, fetchNextPage, index, loadedCount]);

  return items;
};
