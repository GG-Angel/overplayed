import api, { buildURLWithQueryParams } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { playlistPageSchema, type PlaylistPage } from "@/lib/types";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";

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

const getInfinitePlaylistTracksQueryOptions = (playlistId: string) => {
  return infiniteQueryOptions({
    queryKey: queryKeys.playlists.tracks(playlistId),
    queryFn: ({ pageParam }) => getPlaylistTracks({ playlistId, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.next_offset,
    initialPageParam: 0,
  });
};

const useInfinitePlaylistTracks = (playlistId: string) => {
  return useInfiniteQuery({
    ...getInfinitePlaylistTracksQueryOptions(playlistId),
  });
};

const TRACKS_PREFETCH_THRESHOLD = 20;

export const usePlaylistTracks = (playlistId: string, index: number) => {
  const query = useInfinitePlaylistTracks(playlistId);
  const { isSuccess, hasNextPage, isFetchingNextPage, fetchNextPage, data } = query;
  const loadedCount = data?.pages.reduce((acc, curr) => acc + curr.tracks.length, 0) ?? 0;

  useEffect(() => {
    if (!isSuccess || !hasNextPage || isFetchingNextPage) return;

    if (index >= loadedCount - TRACKS_PREFETCH_THRESHOLD) {
      fetchNextPage();
    }
  }, [isSuccess, hasNextPage, isFetchingNextPage, fetchNextPage, index, loadedCount]);

  return query;
};
