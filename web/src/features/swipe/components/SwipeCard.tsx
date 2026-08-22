import { Heart, X } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useImperativeHandle, type Ref } from "react";
import { cn } from "@/lib/utils";
import SwipeCardDecisionOverlay from "./SwipeCardDecisionOverlay";
import type { Track } from "@/types/spotify";
import TrackCard from "@/components/playlist/TrackCard";

const OPACITY_DISTANCE = 200;
const OVERLAY_DISTANCE = 80;
const SWIPE_DISTANCE = 40;

const SWIPE_DURATION = 0.3;
const ROTATE_AMOUNT = 5;
const MOUNT_OFFSET = 20;

export type SwipeDirection = "left" | "right";

export type SwipeCardController = {
  swipe: (direction: SwipeDirection) => void;
};

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

  const cardRotate = useTransform<number, number>([x, rotate], ([xVal, rotateVal]) => {
    const clamped = Math.max(-OPACITY_DISTANCE, Math.min(OPACITY_DISTANCE, xVal));
    return rotateVal + (clamped / OPACITY_DISTANCE) * ROTATE_AMOUNT;
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
      const xTarget = direction === "right" ? OPACITY_DISTANCE : -OPACITY_DISTANCE;
      animate(x, xTarget, {
        duration: SWIPE_DURATION,
        ease: "easeOut",
        onComplete: () => onSwipeEnd?.(direction),
      });
    },
    [onSwipeStart, onSwipeEnd, x]
  );

  const handleDragEnd = () => {
    if (x.get() >= SWIPE_DISTANCE) handleSwipe("right");
    if (x.get() <= -SWIPE_DISTANCE) handleSwipe("left");
  };

  useImperativeHandle(
    ref,
    () => ({
      swipe: handleSwipe,
    }),
    [handleSwipe]
  );

  return (
    <motion.div
      drag={isDragEnabled ? "x" : false}
      dragElastic={0.6}
      dragConstraints={{ left: 0, right: 0 }}
      whileHover={isDragEnabled ? { cursor: "grab" } : undefined}
      whileTap={isDragEnabled ? { scale: 1.05, cursor: "grabbing" } : undefined}
      style={{ x: x, rotate: cardRotate, opacity: cardOpacity, zIndex }}
      initial={{ y: isTopCard ? -MOUNT_OFFSET : 0 }}
      animate={{ y: 0 }}
      onDragEnd={handleDragEnd}
      className={cn("relative origin-bottom transition-shadow", className)}
    >
      <TrackCard track={track} className="select-none" />
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

export default SwipeCard;
