import { useParams } from "react-router-dom";
import { Check, Heart, Undo, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { usePlaylistSwipe } from "@/hooks/playlists";
import LoadingState from "@/components/states/LoadingState";
import AudioPlayer from "@/components/AudioPlayer";
import SwipeProgress from "@/components/SwipeProgress";
import SwipeCard, { type Direction, type SwipeCardHandler } from "@/components/SwipeCard";
import { useRef, useState } from "react";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { item, audio, index, total, likes, dislikes, swipe, undo, isLoading } =
    usePlaylistSwipe(playlistId);

  const cardRef = useRef<SwipeCardHandler | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  if (isLoading || !total) return <LoadingState message="Loading tracks..." />;
  if (!item) return <div>Done!</div>;

  const handleSwipe = (direction: Direction) => {
    setIsSwiping(false);
    if (direction === "left") {
      swipe("dislike");
    } else {
      swipe("like");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl self-center h-screen py-6">
      <SwipeProgress likes={likes} dislikes={dislikes} total={total} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 overflow-hidden">
        <SwipeCard
          key={item.track.id}
          track={item.track}
          ref={cardRef}
          onSwipeStart={() => setIsSwiping(true)}
          onSwipeEnd={handleSwipe}
        />
        <div className="flex items-end gap-2">
          <IconButton
            icon={Undo}
            size="sm"
            onClick={undo}
            disabled={isSwiping || index <= 0}
            variant="yellow"
          />
          <IconButton
            icon={X}
            onClick={() => cardRef.current?.swipe("left")}
            disabled={isSwiping}
            variant="red"
          />
          <IconButton
            icon={Heart}
            onClick={() => cardRef.current?.swipe("right")}
            disabled={isSwiping}
            variant="green"
          />
          <IconButton icon={Check} size="sm" disabled={isSwiping} variant="blue" />
        </div>
      </div>
      <AudioPlayer audio={audio.data} isError={audio.isError} />
    </div>
  );
};

export default PlaylistSwipePage;
