import { useEffect, useRef, useState } from "react";
import type { SwipeCardController } from "../components/SwipeCard";
import { wrapSlice } from "@/lib/utils";
import type { Track } from "@/types/spotify";

const SWIPE_DURATION = 1750;
const LIKE_CHANCE = 0.5;
const MAX_CARD_STACK_HEIGHT = 3;

const useSwipeCarousel = (tracks: Track[]) => {
  const topCardRef = useRef<SwipeCardController | null>(null);
  const [index, setIndex] = useState<number>(0);

  const visibleTracks = wrapSlice(tracks, index, index + MAX_CARD_STACK_HEIGHT);

  // auto-cycle through cards
  useEffect(() => {
    let swiperId: ReturnType<typeof setTimeout>;

    const swipe = () => {
      const direction = Math.random() >= LIKE_CHANCE ? "right" : "left";
      topCardRef.current?.swipe(direction);
      swiperId = setTimeout(swipe, SWIPE_DURATION);
    };

    swiperId = setTimeout(swipe, SWIPE_DURATION);
    return () => clearTimeout(swiperId);
  }, []);

  // go to next card
  const next = () => setIndex((prev) => (prev + 1) % tracks.length);

  return { topCardRef, visibleTracks, next };
};

export default useSwipeCarousel;
