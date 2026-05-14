import { Heart, X } from "lucide-react";
import TrackCard from "./TrackCard";
import type { Track } from "@/lib/types";
import SwipeCardDecisionOverlay from "./SwipeCardDecisionOverlay";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useImperativeHandle, type Ref } from "react";
import { cn } from "@/lib/utils";
import { VISIBLE_CARD_COUNT } from "@/app/pages/playlists/swipe/SwipeView";

export type Direction = "left" | "right";

export type SwipeCardHandler = {
  swipe: (direction: Direction) => void;
};

type SwipeCardProps = {
  track: Track;
  className?: string;
  zIndex?: number;
  baseRotate?: number;
  overlayDistance?: number;
  opacityDistance?: number;
  swipeDistance?: number;
  swipeDuration?: number;
  rotateAmount?: number;
  mountOffset?: number;
  ref?: Ref<SwipeCardHandler>;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: Direction) => void;
};

const SwipeCard = ({
  track,
  onSwipeStart,
  onSwipeEnd,
  className,
  ref,
  overlayDistance = 80,
  opacityDistance = 200,
  swipeDistance = 40,
  swipeDuration = 0.3,
  rotateAmount = 5,
  mountOffset = 20,
  zIndex = 0,
  baseRotate = 0,
}: SwipeCardProps) => {
  const x = useMotionValue(0);

  const likeOpacity = useTransform(x, [0, overlayDistance], [0, 1]);
  const dislikeOpacity = useTransform(x, [-overlayDistance, 0], [1, 0]);
  const cardOpacity = useTransform(
    x,
    [-opacityDistance, -overlayDistance, overlayDistance, opacityDistance],
    [0, 1, 1, 0]
  );

  const baseRotateMV = useMotionValue(baseRotate);
  useEffect(() => {
    const controls = animate(baseRotateMV, baseRotate, {
      duration: swipeDuration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [baseRotate, baseRotateMV, swipeDuration]);

  const cardRotate = useTransform<number, number>([x, baseRotateMV], ([xVal, base]) => {
    const clamped = Math.max(-opacityDistance, Math.min(opacityDistance, xVal));
    return base + (clamped / opacityDistance) * rotateAmount;
  });

  const handleSwipe = useCallback(
    (direction: Direction) => {
      const target = direction === "right" ? opacityDistance : -opacityDistance;
      animate(x, target, {
        duration: swipeDuration,
        ease: "easeOut",
        onPlay: () => onSwipeStart?.(),
        onComplete: () => onSwipeEnd?.(direction),
      });
    },
    [onSwipeStart, onSwipeEnd, opacityDistance, swipeDuration, x]
  );

  const handleDragEnd = () => {
    if (x.get() >= swipeDistance) handleSwipe("right");
    if (x.get() <= -swipeDistance) handleSwipe("left");
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
      style={{ x, rotate: cardRotate, opacity: cardOpacity, zIndex }}
      initial={{ y: zIndex === VISIBLE_CARD_COUNT ? -mountOffset : 0 }}
      animate={{ y: 0 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative origin-bottom transition-shadow",
        zIndex === VISIBLE_CARD_COUNT && "drop-shadow-lg drop-shadow-black/50",
        className
      )}
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
