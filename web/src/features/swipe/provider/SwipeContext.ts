import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type useSwipes from "../hooks/useSwipes";
import type { PlaylistMetadata, PlaylistPageMetadata, SwipesFormOptions, Track } from "@/lib/types";

export type SwipeContextValues = {
  session: ReturnType<typeof useSwipes<Track>>;
  options: SwipesFormOptions;
  setOptions: Dispatch<SetStateAction<SwipesFormOptions>>;
  playlist: {
    pagination: PlaylistPageMetadata;
    metadata: PlaylistMetadata;
    tracks: Track[];
  };
};

export const SwipeContext = createContext<SwipeContextValues | null>(null);

export const useSwipeContext = (): SwipeContextValues => {
  const context = useContext(SwipeContext);
  if (!context) throw new Error("useSwipeContext must be used inside a SwipeProvider");
  return context;
};
