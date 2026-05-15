import AudioPlayer from "@/components/AudioPlayer";
import type { Direction, SwipeCardHandler } from "@/components/SwipeCard";
import SwipeCard from "@/components/SwipeCard";
import SwipeProgress from "@/components/SwipeProgress";
import IconButton from "@/components/ui/IconButton";
import { AnimatePresence } from "framer-motion";
import { Undo, X, Heart, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSwipeContext } from "./SwipeContext";

export const VISIBLE_CARD_COUNT = 3;

type SwipeViewProps = {
  onFinish?: () => void;
};

const SwipeView = ({ onFinish }: SwipeViewProps) => {
  const activeCardRef = useRef<SwipeCardHandler | null>(null);
  const { index, total, items, swipe, undo, audio, isAudioError, status } = useSwipeContext();
  const [isSwiping, setIsSwiping] = useState(false);

  const visibleItems = items.slice(index, index + VISIBLE_CARD_COUNT);

  const triggerSwipe = (direction: Direction) => {
    setIsSwiping(true);
    activeCardRef.current?.swipe(direction);
  };

  const recordSwipe = (direction: Direction) => {
    if (direction === "left") {
      swipe("dislike");
    } else {
      swipe("like");
    }
    setIsSwiping(false);
  };

  useEffect(() => {
    if (total && index >= total) {
      onFinish?.();
    }
  }, [total, index, onFinish]);

  if (status === "loading" || status === "error") return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full self-center h-screen py-6 overflow-hidden">
      <SwipeProgress className="w-full max-w-3xl" />
      <div className="flex-1 flex flex-col w-full items-center justify-center gap-6 overflow-hidden">
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
                onSwipeEnd={recordSwipe}
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
            onClick={() => triggerSwipe("left")}
            disabled={isSwiping || index >= total}
            variant="red"
          />
          <IconButton
            icon={Heart}
            onClick={() => triggerSwipe("right")}
            disabled={isSwiping || index >= total}
            variant="green"
          />
          <IconButton
            icon={Check}
            size="sm"
            onClick={onFinish}
            disabled={isSwiping || index <= 0}
            variant="blue"
          />
        </div>
      </div>
      <AudioPlayer
        className="w-full max-w-3xl"
        audio={audio}
        isError={isAudioError}
        errorMessage="no preview :("
      />
    </div>
  );
};

export default SwipeView;
