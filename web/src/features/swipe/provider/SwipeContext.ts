import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type useSwipes from "../hooks/useSwipes";
import type { Playlist, SwipeSubmissionForm, Track } from "@/lib/types";

export type SwipeContextValues = {
  session: ReturnType<typeof useSwipes<Track>>;
  options: SwipeSubmissionForm["options"];
  setOptions: Dispatch<SetStateAction<SwipeSubmissionForm["options"]>>;
  hasSubmitted: boolean;
  setHasSubmitted: Dispatch<SetStateAction<boolean>>;
  hasLoadedAllTracks: boolean;
  currentIndex: number;
  shuffle: () => void;
  playlist: Playlist;
  tracks: Track[];
  tracksLoaded: number;
};

export const SwipeContext = createContext<SwipeContextValues | null>(null);

export const useSwipeContext = (): SwipeContextValues => {
  const context = useContext(SwipeContext);
  if (!context) throw new Error("useSwipeContext must be used inside a SwipeProvider");
  return context;
};
