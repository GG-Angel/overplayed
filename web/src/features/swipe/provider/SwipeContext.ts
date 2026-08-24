import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type useSwipes from "../hooks/useSwipes";
import type { SwipesForm } from "@/types/swipes";
import type { Playlist, Track } from "@/types/spotify";
import SwipeProvider from "./SwipeProvider";

export type SwipeContextValues = {
  session: ReturnType<typeof useSwipes<Track>>;
  options: SwipesForm["options"];
  setOptions: Dispatch<SetStateAction<SwipesForm["options"]>>;
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
  if (!context) {
    throw new Error(`${useSwipeContext.name} must be used inside a ${SwipeProvider.name}`);
  }
  return context;
};
