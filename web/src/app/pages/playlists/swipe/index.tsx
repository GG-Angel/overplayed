import { useParams } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useState } from "react";
import ErrorState from "@/components/states/ErrorState";
import SwipeView from "./SwipeView";
import ReviewView from "./ReviewView";
import { usePlaylistSwipe } from "@/hooks/usePlaylistSwipe";

type Phase = "swipe" | "review";

const PlaylistSwipePage = () => {
  const { playlistId } = useParams();
  const { items, audio, isAudioError, index, total, likes, dislikes, swipe, undo, isLoading } =
    usePlaylistSwipe(playlistId);

  const [phase, setPhase] = useState<Phase>("swipe");

  if (isLoading) return <LoadingState message="Loading tracks..." />;
  if (total === 0) return <ErrorState message="Playlist is empty" />;

  switch (phase) {
    case "swipe":
      return (
        <SwipeView
          items={items}
          audio={audio}
          isAudioError={isAudioError}
          index={index}
          likes={likes}
          dislikes={dislikes}
          total={total ?? 0}
          onSwipe={swipe}
          onUndo={undo}
          onFinish={() => setPhase("review")}
        />
      );
    case "review":
      return <ReviewView />;
  }
};

export default PlaylistSwipePage;
