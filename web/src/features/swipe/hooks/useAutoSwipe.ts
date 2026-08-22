import { useEffect, useRef, useState } from "react";
import type { SwipeCardController } from "../components/SwipeCard";
import { wrapSlice } from "@/lib/utils";
import type { Track } from "@/types/spotify";

const CARD_STACK_HEIGHT = 3;
const SWIPE_DURATION = 1750;
const LIKE_CHANCE = 0.5;

const useAutoSwipe = (tracks: Track[]) => {
  const currentCardRef = useRef<SwipeCardController | null>(null);
  const [index, setIndex] = useState<number>(0);

  const displayedTracks = wrapSlice(tracks, index, index + CARD_STACK_HEIGHT);

  // auto-cycle through cards
  useEffect(() => {
    let swiperId: ReturnType<typeof setTimeout>;

    const swipe = () => {
      const direction = Math.random() >= LIKE_CHANCE ? "right" : "left";
      currentCardRef.current?.swipe(direction);
      swiperId = setTimeout(swipe, SWIPE_DURATION);
    };

    swiperId = setTimeout(swipe, SWIPE_DURATION);
    return () => clearTimeout(swiperId);
  }, []);

  // go to next card
  const moveToNextTrack = () => setIndex((prev) => (prev + 1) % tracks.length);

  return { currentCardRef, displayedTracks, moveToNextTrack };
};

export default useAutoSwipe;
