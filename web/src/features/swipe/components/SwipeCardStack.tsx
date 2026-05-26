import type { PlaylistItem } from "@/lib/types";
import { AnimatePresence } from "framer-motion";
import { type RefObject } from "react";
import SwipeCard, { type Direction, type SwipeCardHandler } from "./SwipeCard";

const STACK_ROTATE_DEGREES = 3;

type SwipeCardStackProps = {
  items: PlaylistItem[];
  topCardRef?: RefObject<SwipeCardHandler | null>;
  disabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: Direction) => void;
};

const SwipeCardStack = ({
  items,
  topCardRef,
  onSwipeStart,
  onSwipeEnd,
  disabled = false,
}: SwipeCardStackProps) => {
  return (
    <AnimatePresence>
      <div className="grid place-items-center touch-none">
        {items.map((item, i) => {
          const isTopCard = i === 0;
          return (
            <SwipeCard
              className="col-start-1 row-start-1 w-64 sm:w-72 lg:w-84"
              ref={isTopCard ? topCardRef : undefined}
              key={item.track.uri}
              track={item.track}
              onSwipeStart={onSwipeStart}
              onSwipeEnd={onSwipeEnd}
              isDragEnabled={isTopCard && !disabled}
              isTopCard={isTopCard}
              zIndex={items.length - i}
              baseRotate={isTopCard ? 0 : (i % 2 === 0 ? 1 : -1) * STACK_ROTATE_DEGREES}
            />
          );
        })}
      </div>
    </AnimatePresence>
  );
};

export default SwipeCardStack;
