import { getPlaylist, getPlaylistItems, getPlaylists } from "@/lib/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const PLAYLIST_ITEMS_PREFETCH_THRESHOLD = 25;

type Decision = "like" | "dislike";

type Swipe = {
  id: string;
  decision: Decision;
};

const playlistKeys = {
  all: ["playlists"],
  one: (id: string) => [...playlistKeys.all, id],
  tracks: (id: string) => [...playlistKeys.one(id), "tracks"],
} as const;

export const usePlaylist = (id: string | undefined) =>
  useQuery({
    queryKey: playlistKeys.one(id!),
    queryFn: () => getPlaylist(id!),
    enabled: !!id,
  });

export const usePlaylists = () =>
  useQuery({
    queryKey: playlistKeys.all,
    queryFn: getPlaylists,
  });

const usePlaylistItems = (id: string | undefined) =>
  useInfiniteQuery({
    queryKey: playlistKeys.tracks(id!),
    queryFn: ({ pageParam }) => getPlaylistItems(id!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.has_more ? allPages.length : undefined),
    enabled: !!id,
  });

export const usePlaylistSwipe = (id: string | undefined) => {
  const [swipes, setSwipes] = useState<Swipe[]>([]);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePlaylistItems(id);

  const index = swipes.length;
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const currentItem = items.at(index);

  // prefetch next page when the number of remaining items is low
  useEffect(() => {
    const remaining = items.length - index;
    if (remaining < PLAYLIST_ITEMS_PREFETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [index, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const swipe = (decision: Decision) => {
    if (!currentItem) return;
    setSwipes((prev) => [...prev, { id: currentItem.track.id, decision }]);
  };

  const undo = () => {
    if (index <= 0) return;
    setSwipes((prev) => prev.slice(0, -1));
  };

  return {
    currentItem,
    swipes,
    swipe,
    undo,
    isLoading,
    index,
  };
};
