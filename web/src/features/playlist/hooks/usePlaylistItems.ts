import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "@/lib/query";
import { playlistItemsPageSchema, type PlaylistItem } from "@/lib/types";
import api from "@/lib/api-client";

const PREFETCH_THRESHOLD = 25;

type PlaylistItemsResult =
  | { status: "loading"; items: []; total: undefined; error: null }
  | { status: "error"; items: []; total: undefined; error: Error }
  | { status: "success"; items: PlaylistItem[]; total: number; error: null };

const getPlaylistItems = async (playlistId: string, page: number) => {
  const response = await api.get(
    `/playlists/${playlistId}/items?${new URLSearchParams({
      page: page.toString(),
    })}`
  );
  return playlistItemsPageSchema.parse(response);
};

const usePlaylistItems = (playlistId: string, index: number): PlaylistItemsResult => {
  const { data, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.playlists.tracks(playlistId),
      queryFn: ({ pageParam }) => getPlaylistItems(playlistId, pageParam),
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
  } else if (isLoading || total === undefined) {
    return { status: "loading", items: [], total: undefined, error: null };
  } else {
    return { status: "success", items, total, error: null };
  }
};

export default usePlaylistItems;
