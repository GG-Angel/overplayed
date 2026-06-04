import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";

const SwipeSongsPage = () => {
  const { playlist } = useSwipeContext();

  return (
    <div>
      {playlist.metadata.id} {playlist.totalTracks}
    </div>
  );
};

export default SwipeSongsPage;
