import { useParams } from "react-router-dom";
import { Check, Heart, Undo, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { usePlaylistSwipe } from "@/hooks/playlists";
import LoadingState from "@/components/states/LoadingState";
import AudioPlayer from "@/components/AudioPlayer";
import SwipeProgress from "@/components/SwipeProgress";
import SwipeCard, { type Direction, type SwipeCardHandler } from "@/components/SwipeCard";
import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

export const VISIBLE_CARD_COUNT = 3;

const PlaylistSwipePage = () => {
  const cardRef = useRef<SwipeCardHandler | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const { playlistId } = useParams();
  const { items, audio, index, total, likes, dislikes, swipe, undo, isLoading } =
    usePlaylistSwipe(playlistId);

  const handleSwipe = (direction: Direction) => {
    setIsSwiping(false);
    if (direction === "left") {
      swipe("dislike");
    } else {
      swipe("like");
    }
  };

  const visibleItems = items.slice(index, index + VISIBLE_CARD_COUNT);

  if (isLoading || !total) return <LoadingState message="Loading tracks..." />;
  if (index === total) return <div>Done!</div>;

  return (
    <div className="flex flex-col w-full max-w-2xl self-center h-screen py-6">
      <SwipeProgress likes={likes} dislikes={dislikes} total={total} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 overflow-hidden">
        <div className="grid place-items-center touch-none">
          <AnimatePresence>
            {visibleItems.map((item, i) => (
              <SwipeCard
                className="col-start-1 row-start-1"
                key={item.track.uri}
                track={item.track}
                ref={i === 0 ? cardRef : undefined}
                zIndex={visibleItems.length - i}
                baseRotate={i === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * 3}
                onSwipeStart={() => setIsSwiping(true)}
                onSwipeEnd={handleSwipe}
              />
            ))}
          </AnimatePresence>
        </div>
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
