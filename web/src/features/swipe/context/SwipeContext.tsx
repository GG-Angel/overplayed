import { createContext, useContext } from "react";
import type { useSwipePlaylist } from "../hooks/useSwipePlaylist";
import type { SwipeForm } from "../hooks/useSwipeForm";
import type { PlaylistMetadata } from "@/lib/types";

export type PhaseState =
  | { kind: "swipe" }
  | { kind: "nothing" }
  | { kind: "review" }
  | { kind: "submit"; form: SwipeForm }
  | { kind: "success"; newPlaylist: PlaylistMetadata | null }
  | { kind: "error" };

export type SwipeContextValue = ReturnType<typeof useSwipePlaylist> & {
  phase: PhaseState;
  finish: () => void;
  submit: (form: SwipeForm) => void;
  succeed: (newPlaylist: PlaylistMetadata | null) => void;
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
