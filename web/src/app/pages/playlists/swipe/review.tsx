import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";

const SwipeReviewPage = () => {
  const { session, options } = useSwipeContext();

  return (
    <div>
      {session.swipes.length} {options.backupEnabled}
    </div>
  );
};

export default SwipeReviewPage;
