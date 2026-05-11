import { useEffect, useState } from "react";
import usePlaylistTracks from "./usePlaylistTracks";

const PREFETCH_THRESHOLD = 20; // fetch next page when 20 tracks remain

type Decision = "like" | "dislike";

type Swipe = {
  id: string;
  decision: Decision;
};

const usePlaylistSwipe = (id: string | undefined) => {
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

export default usePlaylistSwipe;
