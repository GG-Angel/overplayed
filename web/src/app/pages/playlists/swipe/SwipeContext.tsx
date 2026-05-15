import { usePlaylistSwipe } from "@/hooks/usePlaylistSwipe";
import { createContext, useContext } from "react";

type SwipeContextValue = ReturnType<typeof usePlaylistSwipe>;

export const SwipeContext = createContext<SwipeContextValue | null>(null);

export const useSwipeContext = () => {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error("useSwipeContext must be used inside SwipeProvider");
  return ctx;
};
