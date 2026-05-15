import { useInfiniteQuery } from "@tanstack/react-query";
import { getPlaylistItems } from "@/lib/api";
import { useEffect } from "react";
import { queryKeys } from "@/lib/query";
import type { PlaylistItem } from "@/lib/types";

const PREFETCH_THRESHOLD = 25;

type PlaylistItemsResult =
  | { status: "loading"; items: []; total: undefined; error: null }
  | { status: "error"; items: []; total: undefined; error: Error }
  | { status: "success"; items: PlaylistItem[]; total: number; error: null };

const usePlaylistItems = (id: string, index: number): PlaylistItemsResult => {
  const { data, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.playlists.tracks(id),
      queryFn: ({ pageParam }) => getPlaylistItems(id, pageParam),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => (lastPage.has_more ? allPages.length : undefined),
    });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages.at(-1)?.total;

  // prefetch next page when the number of remaining items is low
  useEffect(() => {
    const remaining = items.length - index;
    if (remaining < PREFETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [index, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return { status: "error", items: [], total: undefined, error: error };
  }

  if (isLoading || !total) {
    return { status: "loading", items: [], total: undefined, error: null };
  }

  return { status: "success", items, total, error: null };
};

export default usePlaylistItems;
