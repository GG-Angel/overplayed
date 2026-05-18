import { createContext, useContext } from "react";
import type { usePlaylistSwipe } from "../hooks/usePlaylistSwipe";

type SwipeContextValue = ReturnType<typeof usePlaylistSwipe>;

export const SwipeContext = createContext<SwipeContextValue | null>(null);

export const useSwipeContext = () => {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error("useSwipeContext must be used inside SwipeProvider");
  return ctx;
};
