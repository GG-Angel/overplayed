import SwipeButtons from "@/features/swipe/components/SwipeButtons";
import type { SwipeCardController, SwipeDirection } from "@/features/swipe/components/SwipeCard";
import SwipeCardStack from "@/features/swipe/components/SwipeCardStack";
import SwipeProgress from "@/features/swipe/components/SwipeProgress";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import { Check, Undo } from "lucide-react";
import { useRef, useState } from "react";

const MAX_CARD_STACK_HEIGHT = 3;

const SwipeSongsPage = () => {
  const { session, playlist } = useSwipeContext();
  const currentSwipeCardRef = useRef<SwipeCardController | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const index = session.swipes.length;
  const visibleTracks = playlist.tracks.slice(index, index + MAX_CARD_STACK_HEIGHT);
  const hasReachedEnd = index >= playlist.totalTracks;
  const canSwipe = !isSwiping && !hasReachedEnd;
  const canUndoOrFinish = !isSwiping && index > 0;

  const triggerSwipe = (direction: SwipeDirection) => {
    if (!currentSwipeCardRef.current || !canSwipe) return;
    setIsSwiping(true);
    currentSwipeCardRef.current.swipe(direction);
  };

  const recordSwipe = (direction: SwipeDirection) => {
    if (hasReachedEnd) return;
    session.recordSwipe({
      item: playlist.tracks[index],
      decision: direction === "left" ? "dislike" : "like",
    });
    setIsSwiping(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full self-center h-full py-6 overflow-hidden">
      <SwipeProgress
        className="w-full max-w-3xl"
        likes={session.likes.length}
        dislikes={session.dislikes.length}
        total={playlist.totalTracks}
      />
      <div className="flex-1 flex flex-col w-full items-center justify-center gap-6 overflow-hidden">
        {!hasReachedEnd ? (
          <SwipeCardStack
            topCardRef={currentSwipeCardRef}
            tracks={visibleTracks}
            canSwipe={canSwipe}
            onSwipeStart={() => setIsSwiping(true)}
            onSwipeEnd={recordSwipe}
          />
        ) : (
          <p className="text-center">
            <span className="block">You've reached the end!</span>
            <span className="block text-muted-foreground">
              Press <Undo className="inline-block" /> to rewind or{" "}
              <Check className="inline-block" /> to finish.
            </span>
          </p>
        )}
        <SwipeButtons
          onUndo={session.undoSwipe}
          onDislike={() => triggerSwipe("left")}
          onLike={() => triggerSwipe("right")}
          // onFinish={finish}
          canUndo={canUndoOrFinish}
          canFinish={canUndoOrFinish}
          canSwipe={canSwipe}
        />
      </div>
      {/* <PreviewPlayer
        url={currentAudioUrl}
        isError={isAudioError}
        isLoading={isAudioLoading}
        className="w-full max-w-3xl"
      /> */}
    </div>
  );
};

export default SwipeSongsPage;
