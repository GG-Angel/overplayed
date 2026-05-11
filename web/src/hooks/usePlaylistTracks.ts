import { api, routes } from "@/lib/api-client";
import type { SpotifyPlaylistTracks } from "@/types/api";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 50;

const getPlaylistTracks = async (
  id: string,
  offset: number,
  limit: number
): Promise<SpotifyPlaylistTracks> => api.get(routes.playlists.tracks(id, offset, limit));

const usePlaylistTracks = (id: string | undefined) =>
  useInfiniteQuery({
    queryKey: ["playlists", id, "tracks"],
    queryFn: ({ pageParam }) => getPlaylistTracks(id!, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length * PAGE_SIZE : undefined,
    enabled: !!id,
  });

export default usePlaylistTracks;
