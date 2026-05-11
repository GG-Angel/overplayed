import { useParams } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { LoadingPage } from "../loading";
import { Check, Heart, Undo, X } from "lucide-react";
import SwipeButton from "@/components/SwipeButton";
import usePlaylistSwipe from "@/hooks/usePlaylistSwipe";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { currentTrack, swipes, swipe, undo, isLoading, isFirst } = usePlaylistSwipe(playlistId);

  const decisionCounter = swipes.reduce(
    (acc, swipe) => {
      acc[swipe.decision]++;
      return acc;
    },
    { like: 0, dislike: 0 }
  );

  if (isLoading) return <LoadingPage />;
  if (!currentTrack) return <div>Done!</div>;

  return (
    <div>
      <TrackCard track={currentTrack} />
      <div className="flex items-end gap-2">
        <SwipeButton icon={Undo} size="sm" onClick={undo} disabled={isFirst} intent="undo" />
        <SwipeButton icon={X} onClick={() => swipe("dislike")} intent="dislike" />
        <SwipeButton icon={Heart} onClick={() => swipe("like")} intent="like" />
        <SwipeButton icon={Check} size="sm" intent="finish" />
      </div>

      <p>Likes: {decisionCounter.like}</p>
      <p>Dislikes: {decisionCounter.dislike}</p>
    </div>
  );
};

export default PlaylistSwipePage;
