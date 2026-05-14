import { getPlaylist, getPlaylistItems, getPlaylists } from "@/lib/api";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { trackPreviewQueryOptions } from "./previews";

const PLAYLIST_ITEMS_PREFETCH_THRESHOLD = 25;
const TRACK_PREVIEW_PREFETCH_LIMIT = 10;

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

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const currentIndex = swipes.length;
  const currentItem = items.at(currentIndex);

  const isrcs = items
    .slice(currentIndex, currentIndex + TRACK_PREVIEW_PREFETCH_LIMIT)
    .map((item) => item.track.external_ids.isrc);
  const audios = useQueries({
    queries: isrcs.map((isrc) => trackPreviewQueryOptions(isrc)),
  });
  const currentAudio = audios[0];

  // prefetch next page when the number of remaining items is low
  useEffect(() => {
    const remaining = items.length - currentIndex;
    if (remaining < PLAYLIST_ITEMS_PREFETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const swipe = (decision: Decision) => {
    if (!currentItem) return;
    setSwipes((prev) => [...prev, { id: currentItem.track.id, decision }]);
  };

  const undo = () => {
    if (currentIndex <= 0) return;
    setSwipes((prev) => prev.slice(0, -1));
  };

  return {
    currentItem,
    currentAudio,
    swipes,
    swipe,
    undo,
    isLoading,
    index: currentIndex,
  };
};
