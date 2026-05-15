import { useParams } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useState } from "react";
import ErrorState from "@/components/states/ErrorState";
import SwipeView from "./SwipeView";
import ReviewView from "./ReviewView";
import SwipeProvider from "./SwipeProvider";
import { useSwipeContext } from "./SwipeContext";

type Phase = "swipe" | "review";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();

  if (!playlistId) return <ErrorState message="Playlist not found" />;

  return (
    <SwipeProvider playlistId={playlistId}>
      <PlaylistSwipePageInner />
    </SwipeProvider>
  );
};

const PlaylistSwipePageInner = () => {
  const [phase, setPhase] = useState<Phase>("swipe");
  const { status, total } = useSwipeContext();

  if (status === "error") return <ErrorState message="Failed to load playlist" />;
  if (status === "loading") return <LoadingState message="Loading tracks..." />;
  if (total === 0) return <ErrorState message="Playlist is empty" />;

  switch (phase) {
    case "swipe":
      return <SwipeView onFinish={() => setPhase("review")} />;
    case "review":
      return <ReviewView />;
  }
};

export default PlaylistSwipePage;
