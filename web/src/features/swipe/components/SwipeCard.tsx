import { Heart, X } from "lucide-react";
import type { Track } from "@/lib/types";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useImperativeHandle, type Ref } from "react";
import { cn } from "@/lib/utils";
import TrackCard from "@/features/playlist/components/TrackCard";
import SwipeCardDecisionOverlay from "./SwipeCardDecisionOverlay";

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
  isDragEnabled?: boolean;
  isTopCard?: boolean;
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
  isDragEnabled = true,
  isTopCard = true,
}: SwipeCardProps) => {
  const xMV = useMotionValue(0);

  const likeOpacity = useTransform(xMV, [0, overlayDistance], [0, 1]);
  const dislikeOpacity = useTransform(xMV, [-overlayDistance, 0], [1, 0]);
  const cardOpacity = useTransform(
    xMV,
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

  const cardRotate = useTransform<number, number>([xMV, baseRotateMV], ([xVal, base]) => {
    const clamped = Math.max(-opacityDistance, Math.min(opacityDistance, xVal));
    return base + (clamped / opacityDistance) * rotateAmount;
  });

  const handleSwipe = useCallback(
    (direction: Direction) => {
      onSwipeStart?.();
      const target = direction === "right" ? opacityDistance : -opacityDistance;
      animate(xMV, target, {
        duration: swipeDuration,
        ease: "easeOut",
        onComplete: () => onSwipeEnd?.(direction),
      });
    },
    [onSwipeStart, onSwipeEnd, opacityDistance, swipeDuration, xMV]
  );

  const handleDragEnd = () => {
    if (xMV.get() >= swipeDistance) handleSwipe("right");
    if (xMV.get() <= -swipeDistance) handleSwipe("left");
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
      whileHover={{ cursor: "grab" }}
      whileTap={{ scale: 1.05, cursor: "grabbing" }}
      style={{ x: xMV, rotate: cardRotate, opacity: cardOpacity, zIndex }}
      initial={{ y: isTopCard ? -mountOffset : 0 }}
      animate={{ y: 0 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative origin-bottom transition-shadow drop-shadow-lg drop-shadow-black/25",
        className
      )}
    >
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
      <TrackCard track={track} />
    </motion.div>
  );
};

export default SwipeCard;
