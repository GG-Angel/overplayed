import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Heart, X, type LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  type Ref,
  type RefObject,
} from "react";
import TrackCard from "../../components/TrackCard";
import type { Track } from "../../types";
import { cn } from "../../utils";

const OPACITY_DISTANCE = 200;
const OVERLAY_DISTANCE = 80;
const SWIPE_DISTANCE = 40;
const SWIPE_DURATION = 0.3;
const ROTATE_AMOUNT = 5;
const MOUNT_OFFSET = 20;
const STACK_ROTATE_DEGREES = 3;

export type SwipeDirection = "left" | "right";
export type SwipeCardController = { swipe: (direction: SwipeDirection) => void };

const SwipeCardDecisionOverlay = ({
  icon: Icon,
  className,
  opacity = 1,
}: {
  icon: LucideIcon;
  opacity?: number | MotionValue<number>;
  className?: string;
}) => (
  <motion.div
    style={{ opacity }}
    className={cn(
      "pointer-events-none absolute inset-0 flex justify-center items-center bg-linear-to-t rounded-xl",
      className
    )}
  >
    <Icon
      fill="currentColor"
      fillOpacity={0.6}
      className="drop-shadow-black/50 drop-shadow-lg size-1/3"
    />
  </motion.div>
);

type SwipeCardProps = {
  track: Track;
  className?: string;
  zIndex?: number;
  baseRotate?: number;
  isDragEnabled?: boolean;
  isTopCard?: boolean;
  ref?: Ref<SwipeCardController>;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: SwipeDirection) => void;
};

const SwipeCard = ({
  track,
  onSwipeStart,
  onSwipeEnd,
  className,
  ref,
  zIndex = 0,
  baseRotate = 0,
  isDragEnabled = true,
  isTopCard = true,
}: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useMotionValue(baseRotate);
  const cardRotate = useTransform<number, number>([x, rotate], ([xValue, rotateValue]) => {
    const clamped = Math.max(-OPACITY_DISTANCE, Math.min(OPACITY_DISTANCE, xValue));
    return rotateValue + (clamped / OPACITY_DISTANCE) * ROTATE_AMOUNT;
  });
  const likeOpacity = useTransform(x, [0, OVERLAY_DISTANCE], [0, 1]);
  const dislikeOpacity = useTransform(x, [-OVERLAY_DISTANCE, 0], [1, 0]);
  const cardOpacity = useTransform(
    x,
    [-OPACITY_DISTANCE, -OVERLAY_DISTANCE, OVERLAY_DISTANCE, OPACITY_DISTANCE],
    [0, 1, 1, 0]
  );

  useEffect(() => {
    const controls = animate(rotate, baseRotate, {
      duration: SWIPE_DURATION,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [baseRotate, rotate]);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      onSwipeStart?.();
      animate(x, direction === "right" ? OPACITY_DISTANCE : -OPACITY_DISTANCE, {
        duration: SWIPE_DURATION,
        ease: "easeOut",
        onComplete: () => onSwipeEnd?.(direction),
      });
    },
    [onSwipeStart, onSwipeEnd, x]
  );

  useImperativeHandle(ref, () => ({ swipe: handleSwipe }), [handleSwipe]);
  return (
    <motion.div
      drag={isDragEnabled ? "x" : false}
      dragElastic={0.6}
      dragConstraints={{ left: 0, right: 0 }}
      whileHover={isDragEnabled ? { cursor: "grab" } : undefined}
      whileTap={isDragEnabled ? { scale: 1.05, cursor: "grabbing" } : undefined}
      style={{ x, rotate: cardRotate, opacity: cardOpacity, zIndex }}
      initial={{ y: isTopCard ? -MOUNT_OFFSET : 0 }}
      animate={{ y: 0 }}
      onDragEnd={() => {
        if (x.get() >= SWIPE_DISTANCE) handleSwipe("right");
        if (x.get() <= -SWIPE_DISTANCE) handleSwipe("left");
      }}
      className={cn("relative origin-bottom transition-shadow", className)}
    >
      <TrackCard track={track} />
      <SwipeCardDecisionOverlay
        icon={Heart}
        opacity={likeOpacity}
        className="text-accent from-accent/50"
      />
      <SwipeCardDecisionOverlay
        icon={X}
        opacity={dislikeOpacity}
        className="text-destructive from-destructive/50"
      />
    </motion.div>
  );
};

type SwipeDeckProps = {
  tracks: Track[];
  topCardRef?: RefObject<SwipeCardController | null>;
  canSwipe?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: SwipeDirection) => void;
};

const SwipeDeck = ({
  tracks,
  topCardRef,
  onSwipeStart,
  onSwipeEnd,
  canSwipe = true,
}: SwipeDeckProps) => (
  <AnimatePresence>
    <div className="grid place-items-end touch-none">
      {tracks.map((track, index) => {
        const isTopCard = index === 0;
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
            baseRotate={
              isTopCard ? 0 : (index % 2 === 0 ? 1 : -1) * STACK_ROTATE_DEGREES
            }
            zIndex={tracks.length - index}
          />
        );
      })}
    </div>
  </AnimatePresence>
);

export default SwipeDeck;
