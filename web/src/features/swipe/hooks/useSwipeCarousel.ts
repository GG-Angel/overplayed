import { useEffect, useRef, useState } from "react";
import type { SwipeCardController } from "../components/SwipeCard";
import { type PlaylistItem } from "@/lib/types";
import { wrapSlice } from "@/lib/utils";
import { VISIBLE_CARD_COUNT } from "../views/SwipeView";

const SWIPE_DURATION = 1750;
const SWIPE_RIGHT_CHANCE = 0.5;

const useSwipeCarousel = (items: PlaylistItem[]) => {
  const activeCardRef = useRef<SwipeCardController | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visiblePlaylistItems = wrapSlice(items, currentIndex, currentIndex + VISIBLE_CARD_COUNT);

  // go to next card
  const next = () => setCurrentIndex((prev) => (prev + 1) % items.length);

  // auto-cycle through cards
  useEffect(() => {
    let swiperId: ReturnType<typeof setTimeout>;

    const swipe = () => {
      const direction = Math.random() >= SWIPE_RIGHT_CHANCE ? "right" : "left";
      activeCardRef.current?.swipe(direction);

      swiperId = setTimeout(swipe, SWIPE_DURATION);
    };

    swiperId = setTimeout(swipe, SWIPE_DURATION);

    return () => clearTimeout(swiperId);
  }, []);

  return { activeCardRef, items: visiblePlaylistItems, next };
};

export default useSwipeCarousel;
