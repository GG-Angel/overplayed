import type { ReactNode } from "react";
import { SwipeContext } from "./SwipeContext";
import { usePlaylistSwipe } from "../hooks/usePlaylistSwipe";

type SwipeProviderProps = {
  playlistId: string;
  children?: ReactNode;
};

const SwipeProvider = ({ playlistId, children }: SwipeProviderProps) => {
  const swipe = usePlaylistSwipe(playlistId);
  return <SwipeContext.Provider value={swipe}>{children}</SwipeContext.Provider>;
};

export default SwipeProvider;
