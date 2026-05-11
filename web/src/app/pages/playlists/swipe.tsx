import { useParams } from "react-router-dom";
import TrackCard from "@/features/playlists/components/TrackCard";
import { Check, Heart, Undo, X } from "lucide-react";
import SwipeButton from "@/features/playlists/components/SwipeButton";
import { usePlaylistSwipe } from "@/features/playlists/hooks";
import LoadingState from "@/components/states/LoadingState";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { currentTrack, swipe, undo, isLoading, isFirst } = usePlaylistSwipe(playlistId);

  if (isLoading) return <LoadingState />;
  if (!currentTrack) return <div>Done!</div>;

  return (
    <div>
      <TrackCard track={currentTrack} />
      <div className="flex items-end gap-2">
        <SwipeButton icon={Undo} size="sm" onClick={undo} disabled={isFirst} intent="undo" />
        <SwipeButton icon={X} onClick={() => swipe("dislike")} intent="dislike" />
        <SwipeButton icon={Heart} onClick={() => swipe("like")} intent="like" />
        {/* TODO: make finish button functional */}
        <SwipeButton icon={Check} size="sm" intent="finish" />
      </div>
    </div>
  );
};

export default PlaylistSwipePage;
