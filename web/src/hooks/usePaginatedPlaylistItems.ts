import { useInfiniteQuery } from "@tanstack/react-query";
import { getPlaylistItems } from "@/lib/api";
import { useEffect } from "react";
import { queryKeys } from "@/lib/query";

const PREFETCH_THRESHOLD = 25;

const usePaginatedPlaylistItems = (id: string | undefined, index: number = 0) => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: queryKeys.playlists.tracks(id!),
    queryFn: ({ pageParam }) => getPlaylistItems(id!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.has_more ? allPages.length : undefined),
    enabled: !!id,
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

  return { items, total, isLoading };
};

export default usePaginatedPlaylistItems;
