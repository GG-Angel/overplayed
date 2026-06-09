import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type useSwipes from "../hooks/useSwipes";
import type { PlaylistMetadata, Track } from "@/lib/types";
import type useTimer from "@/hooks/useTimer";

export type SwipeContextValues = {
  session: ReturnType<typeof useSwipes<Track>>;
  options: SwipeFormOptions;
  setOptions: Dispatch<SetStateAction<SwipeFormOptions>>;
  timer: ReturnType<typeof useTimer>;
  playlist: {
    metadata: PlaylistMetadata;
    tracks: Track[];
    totalTracks: number;
  };
};

export type SwipeFormOptions = {
  backupEnabled: boolean;
};

export const SwipeContext = createContext<SwipeContextValues | null>(null);

export const useSwipeContext = (): SwipeContextValues => {
  const context = useContext(SwipeContext);
  if (!context) throw new Error("useSwipeContext must be used inside a SwipeProvider");
  return context;
};
