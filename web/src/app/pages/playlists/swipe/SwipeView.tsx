import AudioPlayer from "@/components/AudioPlayer";
import type { Direction, SwipeCardHandler } from "@/components/SwipeCard";
import SwipeCard from "@/components/SwipeCard";
import SwipeProgress from "@/components/SwipeProgress";
import IconButton from "@/components/ui/IconButton";
import type { Decision } from "@/hooks/playlists";
import type { PlaylistItem } from "@/lib/types";
import { AnimatePresence } from "framer-motion";
import { Undo, X, Heart, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const VISIBLE_CARD_COUNT = 3;

type SwipeViewProps = {
  items: PlaylistItem[];
  audio: HTMLAudioElement | undefined;
  isAudioError: boolean;
  index: number;
  likes: number;
  dislikes: number;
  total: number;
  onSwipe: (decision: Decision) => void;
  onUndo: () => void;
  onFinish: () => void;
};

const SwipeView = ({
  items,
  audio,
  isAudioError,
  index,
  likes,
  dislikes,
  total,
  onSwipe,
  onUndo,
  onFinish,
}: SwipeViewProps) => {
  const activeCardRef = useRef<SwipeCardHandler | null>(null);

  const [isSwiping, setIsSwiping] = useState(false);

  const handleSwipe = (direction: Direction) => {
    setIsSwiping(false);
    if (direction === "left") {
      onSwipe("dislike");
    } else {
      onSwipe("like");
    }
  };

  useEffect(() => {
    if (index === total) {
      onFinish();
    }
  }, [index, total, onFinish]);

  const visibleItems = items.slice(index, index + VISIBLE_CARD_COUNT);

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
                ref={i === 0 ? activeCardRef : undefined}
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
            onClick={onUndo}
            disabled={isSwiping || index === 0}
            variant="yellow"
          />
          <IconButton
            icon={X}
            onClick={() => activeCardRef.current?.swipe("left")}
            disabled={isSwiping || index === total}
            variant="red"
          />
          <IconButton
            icon={Heart}
            onClick={() => activeCardRef.current?.swipe("right")}
            disabled={isSwiping || index === total}
            variant="green"
          />
          <IconButton
            icon={Check}
            size="sm"
            onClick={onFinish}
            disabled={isSwiping || index === total}
            variant="blue"
          />
        </div>
      </div>
      <AudioPlayer audio={audio} isError={isAudioError} />
    </div>
  );
};

export default SwipeView;
