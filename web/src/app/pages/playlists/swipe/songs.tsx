import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";

const SwipeSongsPage = () => {
  const { playlist } = useSwipeContext();

  return (
    <div>
      {playlist.metadata.id} {playlist.items.pages.flatMap((p) => p.items).length}
    </div>
  );
};

export default SwipeSongsPage;
