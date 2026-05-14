import { Heart, X } from "lucide-react";
import TrackCard from "./TrackCard";
import type { Track } from "@/lib/types";
import SwipeCardDecisionOverlay from "./SwipeCardDecisionOverlay";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useImperativeHandle, type Ref } from "react";

const OPACITY_DISTANCE = 200;
const OVERLAY_DISTANCE = 80;
const SWIPE_DISTANCE = 40;
const ROTATE_LIMIT = 5;

export type Direction = "left" | "right";

export type SwipeCardHandler = {
  swipe: (direction: Direction) => void;
};

type SwipeCardProps = {
  track: Track;
  ref?: Ref<SwipeCardHandler>;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: Direction) => void;
};

const SwipeCard = ({ track, onSwipeStart, onSwipeEnd, ref }: SwipeCardProps) => {
  const x = useMotionValue(0);

  const likeOpacity = useTransform(x, [0, OVERLAY_DISTANCE], [0, 1]);
  const dislikeOpacity = useTransform(x, [-OVERLAY_DISTANCE, 0], [1, 0]);
  const cardOpacity = useTransform(
    x,
    [-OPACITY_DISTANCE, -OVERLAY_DISTANCE, OVERLAY_DISTANCE, OPACITY_DISTANCE],
    [0, 1, 1, 0]
  );

  const cardRotate = useTransform(
    x,
    [-OPACITY_DISTANCE, 0, OPACITY_DISTANCE],
    [-ROTATE_LIMIT, 0, ROTATE_LIMIT]
  );

  const handleSwipe = useCallback(
    (direction: Direction) => {
      const target = direction === "right" ? OPACITY_DISTANCE : -OPACITY_DISTANCE;
      animate(x, target, {
        duration: 0.3,
        ease: "easeOut",
        onPlay: () => onSwipeStart?.(),
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
      drag="x"
      dragElastic={0.6}
      dragConstraints={{ left: 0, right: 0 }}
      whileHover={{ cursor: "grab" }}
      whileTap={{ scale: 1.05, cursor: "grabbing" }}
      style={{ x, rotate: cardRotate, opacity: cardOpacity }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onDragEnd={handleDragEnd}
      className="relative origin-bottom"
    >
      <SwipeCardDecisionOverlay
        icon={Heart}
        opacity={likeOpacity}
        className="text-accent from-accent/50 absolute inset-0"
      />
      <SwipeCardDecisionOverlay
        icon={X}
        opacity={dislikeOpacity}
        className="text-destructive from-destructive/50 absolute inset-0"
      />
      <TrackCard track={track} />
    </motion.div>
  );
};

export default SwipeCard;
