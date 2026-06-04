import { createContext, useContext } from "react";
import type useSwipes from "../hooks/useSwipes";
import type { PlaylistMetadata, PlaylistItemsPage, Track } from "@/lib/types";

type SwipeContextValues = {
  session: ReturnType<typeof useSwipes<Track>>;
  options: SwipeFormOptions;
  setOptions: (options: SwipeFormOptions) => void;

  playlist: {
    metadata: PlaylistMetadata;
    items: {
      pages: PlaylistItemsPage[];
    };
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
