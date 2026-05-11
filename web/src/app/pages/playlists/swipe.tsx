import { useParams } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { useEffect, useState } from "react";
import type { SpotifyPlaylistTracks } from "@/types/api";
import { api, routes } from "@/lib/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LoadingPage } from "../loading";
import { Check, Heart, Undo, X } from "lucide-react";
import SwipeButton from "@/components/SwipeButton";

const PAGE_SIZE = 25;
const PREFETCH_THRESHOLD = 20; // fetch next page when 20 tracks remain

type Decision = "like" | "dislike";

type Swipe = {
  id: string;
  decision: Decision;
};

const getPlaylistTracks = async (
  id: string,
  offset: number,
  limit: number
): Promise<SpotifyPlaylistTracks> => api.get(routes.playlists.tracks(id, offset, limit));

const PlaylistSwipePage = () => {
  const { id } = useParams();
  const [index, setIndex] = useState(0);
  const [swipes, setSwipes] = useState<Swipe[]>([]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["playlists", id, "tracks"],
    queryFn: ({ pageParam }) => getPlaylistTracks(id!, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length * PAGE_SIZE : undefined,
    enabled: !!id,
  });

  const tracks = data?.pages.flatMap((p) => p.tracks) ?? [];
  const currentTrack = tracks.at(index);
  const decisionCounter = swipes.reduce(
    (acc, swipe) => {
      acc[swipe.decision]++;
      return acc;
    },
    { like: 0, dislike: 0 }
  );

  // prefetch next page when user is near end of loaded page
  useEffect(() => {
    const remaining = tracks.length - index;
    if (remaining < PREFETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [index, tracks.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSwipe = (decision: Decision) => {
    if (!currentTrack) return;
    setSwipes((prev) => [...prev, { id: currentTrack.track.id, decision }]);
    setIndex((i) => i + 1);
  };

  const handleUndo = () => {
    if (index <= 0) return;
    setSwipes((prev) => prev.slice(0, -1));
    setIndex((i) => i - 1);
  };

  if (isLoading) return <LoadingPage />;
  if (!currentTrack) return <div>Done!</div>;

  return (
    <div>
      <TrackCard track={currentTrack} />
      <div className="flex items-end gap-2">
        <div className="flex items-end gap-2">
          <SwipeButton
            icon={Undo}
            size="sm"
            onClick={handleUndo}
            disabled={index <= 0}
            intent="undo"
          />
          <SwipeButton icon={X} onClick={() => handleSwipe("dislike")} intent="dislike" />
          <SwipeButton icon={Heart} onClick={() => handleSwipe("like")} intent="like" />
          <SwipeButton icon={Check} size="sm" intent="finish" />
        </div>
      </div>

      <div>
        {index + 1} / {tracks.length}
        {hasNextPage ? "+" : ""}
      </div>
      <p>Likes: {decisionCounter.like}</p>
      <p>Dislikes: {decisionCounter.dislike}</p>
    </div>
  );
};

export default PlaylistSwipePage;
