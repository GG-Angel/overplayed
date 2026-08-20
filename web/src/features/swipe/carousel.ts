import { useEffect, useRef, useState } from "react";
import type { Track } from "../../types";
import { wrapSlice } from "../../utils";
import type { SwipeCardController } from "./SwipeDeck";

const SWIPE_DURATION = 1750;
const LIKE_CHANCE = 0.5;
const MAX_CARD_STACK_HEIGHT = 3;

export const useSwipeCarousel = (tracks: Track[]) => {
  const topCardRef = useRef<SwipeCardController | null>(null);
  const [index, setIndex] = useState(0);
  const visibleTracks = wrapSlice(tracks, index, index + MAX_CARD_STACK_HEIGHT);

  useEffect(() => {
    let swiperId: ReturnType<typeof setTimeout>;
    const swipe = () => {
      topCardRef.current?.swipe(Math.random() >= LIKE_CHANCE ? "right" : "left");
      swiperId = setTimeout(swipe, SWIPE_DURATION);
    };
    swiperId = setTimeout(swipe, SWIPE_DURATION);
    return () => clearTimeout(swiperId);
  }, []);

  return {
    topCardRef,
    visibleTracks,
    next: () => setIndex((previous) => (previous + 1) % tracks.length),
  };
};
