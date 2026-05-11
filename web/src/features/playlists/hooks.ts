import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPlaylist, getPlaylists, getPlaylistTracks } from "./api";
import { useState, useEffect } from "react";

const PAGE_SIZE = 50;
const PREFETCH_THRESHOLD = 20; // fetch next page when 20 tracks remain

type Decision = "like" | "dislike";

type Swipe = {
  id: string;
  decision: Decision;
};

const playlistKeys = {
  all: ["playlists"] as const,
  one: (id: string) => [...playlistKeys.all, id] as const,
  tracks: (id: string) => [...playlistKeys.one(id), "tracks"] as const,
};

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

const usePlaylistTracks = (id: string | undefined) =>
  useInfiniteQuery({
    queryKey: playlistKeys.tracks(id!),
    queryFn: ({ pageParam }) => getPlaylistTracks(id!, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length * PAGE_SIZE : undefined,
    enabled: !!id,
  });

export const usePlaylistSwipe = (id: string | undefined) => {
  const [swipes, setSwipes] = useState<Swipe[]>([]);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePlaylistTracks(id);

  const tracks = data?.pages.flatMap((p) => p.tracks) ?? [];

  const index = swipes.length;
  const currentTrack = tracks.at(index);
  const isFirst = index <= 0;

  useEffect(() => {
    const remaining = tracks.length - index;
    if (remaining < PREFETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [index, tracks.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const swipe = (decision: Decision) => {
    if (!currentTrack) return;
    setSwipes((prev) => [...prev, { id: currentTrack.track.id, decision }]);
  };

  const undo = () => {
    if (index <= 0) return;
    setSwipes((prev) => prev.slice(0, -1));
  };

  return {
    currentTrack,
    swipes,
    swipe,
    undo,
    isLoading,
    isFirst,
  };
};
