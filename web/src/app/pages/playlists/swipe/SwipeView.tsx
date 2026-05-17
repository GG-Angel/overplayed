import AudioPlayer from "@/components/AudioPlayer";
import type { Direction, SwipeCardHandler } from "@/components/SwipeCard";
import SwipeCard from "@/components/SwipeCard";
import SwipeProgress from "@/components/SwipeProgress";
import IconButton from "@/components/ui/IconButton";
import { AnimatePresence } from "framer-motion";
import { Undo, X, Heart, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSwipeContext } from "./SwipeContext";
import TrackCard from "@/components/TrackCard";

export const VISIBLE_CARD_COUNT = 3;
const STACK_ROTATE_DEGREES = 3;

const directionToDecision = {
  left: "dislike",
  right: "like",
} as const;

type SwipeViewProps = {
  onFinish?: () => void;
};

const SwipeView = ({ onFinish }: SwipeViewProps) => {
  const { index, total, items, swipe, undo, audio, isAudioError, status } = useSwipeContext();
  const activeCardRef = useRef<SwipeCardHandler | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const visibleItems = items.slice(index, index + VISIBLE_CARD_COUNT);
  const isComplete = total !== undefined && index >= total;
  const canSwipe = !isSwiping && !isComplete;
  const canUndo = !isSwiping && index > 0;

  const triggerSwipe = (direction: Direction) => {
    setIsSwiping(true);
    activeCardRef.current?.swipe(direction);
  };

  const recordSwipe = (direction: Direction) => {
    swipe(directionToDecision[direction]);
    setIsSwiping(false);
  };

  // useEffect(() => {
  //   if (isComplete) onFinish?.();
  // }, [isComplete, onFinish]);

  if (status === "loading" || status === "error") return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full self-center h-screen py-6 overflow-hidden">
      <SwipeProgress className="w-full max-w-3xl" />

      <div className="flex-1 flex flex-col w-full items-center justify-center gap-6 overflow-hidden">
        <div className="grid place-items-center touch-none">
          {!isComplete ? (
            <AnimatePresence>
              {visibleItems.map((item, i) => {
                const isActive = i === 0;
                return (
                  <SwipeCard
                    key={item.track.uri}
                    ref={isActive ? activeCardRef : undefined}
                    track={item.track}
                    className="col-start-1 row-start-1"
                    zIndex={visibleItems.length - i}
                    baseRotate={isActive ? 0 : (i % 2 === 0 ? 1 : -1) * STACK_ROTATE_DEGREES}
                    isDragEnabled={isActive && !isSwiping}
                    onSwipeStart={() => setIsSwiping(true)}
                    onSwipeEnd={recordSwipe}
                  />
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="text-center">
              <p>You've reached the end!</p>
              <p className="text-muted-foreground">
                Press <Check className="inline-block" /> to finish or{" "}
                <Undo className="inline-block" /> to rewind.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <IconButton icon={Undo} size="sm" variant="yellow" onClick={undo} disabled={!canUndo} />
          <IconButton
            icon={X}
            variant="red"
            onClick={() => triggerSwipe("left")}
            disabled={!canSwipe}
          />
          <IconButton
            icon={Heart}
            variant="green"
            onClick={() => triggerSwipe("right")}
            disabled={!canSwipe}
          />
          <IconButton
            icon={Check}
            size="sm"
            variant="blue"
            onClick={onFinish}
            disabled={!canUndo}
          />
        </div>
      </div>

      <AudioPlayer
        audio={audio}
        isError={isAudioError}
        errorMessage="no preview :("
        className="w-full max-w-3xl"
      />
    </div>
  );
};

export default SwipeView;
