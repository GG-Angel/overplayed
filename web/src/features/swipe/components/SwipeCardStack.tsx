import type { Track } from "@/lib/types";
import { AnimatePresence } from "framer-motion";
import { type RefObject } from "react";
import SwipeCard, { type SwipeDirection, type SwipeCardController } from "./SwipeCard";

const STACK_ROTATE_DEGREES = 3;

type SwipeCardStackProps = {
  tracks: Track[];
  topCardRef?: RefObject<SwipeCardController | null>;
  canSwipe?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: SwipeDirection) => void;
};

const SwipeCardStack = ({
  tracks,
  topCardRef,
  onSwipeStart,
  onSwipeEnd,
  canSwipe = true,
}: SwipeCardStackProps) => {
  return (
    <AnimatePresence>
      <div className="grid place-items-end touch-none">
        {tracks.map((track, i) => {
          const isTopCard = i === 0;
          return (
            <SwipeCard
              className="col-start-1 row-start-1 w-64 sm:w-72 lg:w-84"
              ref={isTopCard ? topCardRef : undefined}
              key={track.uri}
              track={track}
              onSwipeStart={onSwipeStart}
              onSwipeEnd={onSwipeEnd}
              isDragEnabled={isTopCard && canSwipe}
              isTopCard={isTopCard}
              baseRotate={isTopCard ? 0 : (i % 2 === 0 ? 1 : -1) * STACK_ROTATE_DEGREES}
              zIndex={tracks.length - i}
            />
          );
        })}
      </div>
    </AnimatePresence>
  );
};

export default SwipeCardStack;
