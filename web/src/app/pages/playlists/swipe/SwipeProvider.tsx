import { usePlaylistSwipe } from "@/hooks/usePlaylistSwipe";
import type { ReactNode } from "react";
import { SwipeContext } from "./SwipeContext";

type SwipeProviderProps = {
  playlistId: string;
  children?: ReactNode;
};

const SwipeProvider = ({ playlistId, children }: SwipeProviderProps) => {
  const swipe = usePlaylistSwipe(playlistId);
  return <SwipeContext.Provider value={swipe}>{children}</SwipeContext.Provider>;
};

export default SwipeProvider;
