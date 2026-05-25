import { createContext, useContext } from "react";
import type { usePlaylistSwipe } from "../hooks/usePlaylistSwipe";
import type { ReviewForm } from "../hooks/useReviewForm";
import type { Playlist } from "@/lib/types";

export type PhaseState =
  | { kind: "swipe" }
  | { kind: "nothing" }
  | { kind: "review" }
  | { kind: "submit"; form: ReviewForm }
  | { kind: "success"; newPlaylist: Playlist | null }
  | { kind: "error" };

export type SwipeContextValue = ReturnType<typeof usePlaylistSwipe> & {
  phase: PhaseState;
  finish: () => void;
  submit: (form: ReviewForm) => void;
  succeed: (newPlaylist: Playlist | null) => void;
  fail: () => void;
  back: () => void;
  goHome: () => void;
};

export const SwipeContext = createContext<SwipeContextValue | null>(null);

export const useSwipeContext = () => {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error("useSwipeContext must be used inside SwipeProvider");
  return ctx;
};
