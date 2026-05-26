import { useEffect, useRef, useState } from "react";
import type { SwipeCardHandler } from "../components/SwipeCard";
import { playlistItemsPageSchema } from "@/lib/types";
import { wrapSlice } from "@/lib/utils";
import { VISIBLE_CARD_COUNT } from "../views/SwipeView";
import mockPlaylistJson from "../../../../public/landing-playlist-items.json";

const SWIPE_DURATION = 1750;

const useSwipeCarousel = () => {
  const activeCardRef = useRef<SwipeCardHandler | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const mockPlaylist = playlistItemsPageSchema.parse(mockPlaylistJson);
  const visiblePlaylistItems = wrapSlice(
    mockPlaylist.items,
    currentIndex,
    currentIndex + VISIBLE_CARD_COUNT
  );

  // go to next card
  const next = () => setCurrentIndex((prev) => (prev + 1) % mockPlaylist.items.length);

  // auto-cycle through cards
  useEffect(() => {
    let swiperId: ReturnType<typeof setTimeout>;

    const swipe = () => {
      const direction = Math.random() >= 0.6 ? "right" : "left";
      activeCardRef.current?.swipe(direction);

      swiperId = setTimeout(swipe, SWIPE_DURATION);
    };

    swiperId = setTimeout(swipe, SWIPE_DURATION);

    return () => clearTimeout(swiperId);
  }, []);

  return { activeCardRef, items: visiblePlaylistItems, next };
};

export default useSwipeCarousel;
