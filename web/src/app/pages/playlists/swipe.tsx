import { useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import SwipeProvider from "@/features/swipe/context/SwipeProvider";
import SwipeStateHandler from "@/features/swipe/views/SwipeStateHandler";

const SwipePage = () => {
  const { playlistId } = useParams();

  if (!playlistId) return <ErrorState message="Playlist not found" />;

  return (
    <SwipeProvider playlistId={playlistId}>
      <SwipeStateHandler />
    </SwipeProvider>
  );
};

export default SwipePage;
