import type { SwipeDirection, SwipeCardController } from "@/features/swipe/components/SwipeCard";
import SwipeProgress from "@/features/swipe/components/SwipeProgress";
import { Undo, Check } from "lucide-react";
import { useRef, useState } from "react";
import { useSwipeContext } from "../context/SwipeContext";
import PreviewPlayer from "@/features/previews/components/PreviewPlayer";
import SwipeButtons from "../components/SwipeButtons";
import SwipeCardStack from "../components/SwipeCardStack";

export const VISIBLE_CARD_COUNT = 3;

const directionToDecision = {
  left: "dislike",
  right: "like",
} as const;

const SwipeView = () => {
  const [isSwiping, setIsSwiping] = useState(false);
  const activeCardRef = useRef<SwipeCardController | null>(null);

  const {
    currentIndex,
    currentAudioUrl,
    isAudioError,
    isAudioLoading,
    total,
    items,
    swipe,
    undo,
    status,
    likes,
    dislikes,
    finish,
  } = useSwipeContext();

  const visibleItems = items.slice(currentIndex, currentIndex + VISIBLE_CARD_COUNT);
  const isComplete = total !== undefined && currentIndex >= total;
  const canSwipe = !isSwiping && !isComplete;
  const canUndoOrFinish = !isSwiping && currentIndex > 0;

  const triggerSwipe = (direction: SwipeDirection) => {
    setIsSwiping(true);
    activeCardRef.current?.swipe(direction);
  };

  const recordSwipe = (direction: SwipeDirection) => {
    swipe(directionToDecision[direction]);
    setIsSwiping(false);
  };

  if (status === "loading" || status === "error") return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full self-center h-full py-6 overflow-hidden">
      <SwipeProgress
        className="w-full max-w-3xl"
        likes={likes.length}
        dislikes={dislikes.length}
        total={total}
      />
      <div className="flex-1 flex flex-col w-full items-center justify-center gap-6 overflow-hidden">
        {!isComplete ? (
          <SwipeCardStack
            topCardRef={activeCardRef}
            items={visibleItems}
            disabled={isSwiping}
            onSwipeStart={() => setIsSwiping(true)}
            onSwipeEnd={recordSwipe}
          />
        ) : (
          <p className="text-center">
            <span className="block">You've reached the end!</span>
            <span className="block text-muted-foreground">
              Press <Undo className="inline-block" /> to rewind or{" "}
              <Check className="inline-block" /> to finish.
            </span>
          </p>
        )}
        <SwipeButtons
          onUndo={undo}
          onDislike={() => triggerSwipe("left")}
          onLike={() => triggerSwipe("right")}
          onFinish={finish}
          canUndo={canUndoOrFinish}
          canFinish={canUndoOrFinish}
          canSwipe={canSwipe}
        />
      </div>
      <PreviewPlayer
        url={currentAudioUrl}
        isError={isAudioError}
        isLoading={isAudioLoading}
        className="w-full max-w-3xl"
      />
    </div>
  );
};

export default SwipeView;
