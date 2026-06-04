import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";

const SwipeSongsPage = () => {
  const { playlist, items } = useSwipeContext();

  return (
    <div>
      {playlist.id} {items.flatMap((p) => p.items).length}
    </div>
  );
};

export default SwipeSongsPage;
