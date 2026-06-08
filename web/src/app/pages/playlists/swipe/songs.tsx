import { useTrackPreviewUrl } from "@/features/previews/api/get-track-preview";
import AudioPlayer from "@/features/previews/components/PreviewPlayer";
import SwipeButtons from "@/features/swipe/components/SwipeButtons";
import type { SwipeCardController, SwipeDirection } from "@/features/swipe/components/SwipeCard";
import SwipeCardStack from "@/features/swipe/components/SwipeCardStack";
import SwipeProgress from "@/features/swipe/components/SwipeProgress";
import useSwipePreviews from "@/features/swipe/hooks/useSwipePreviews";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import { Check, Undo } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const MAX_CARD_STACK_HEIGHT = 3;

const SwipeSongsPage = () => {
  const { session, playlist } = useSwipeContext();
  const navigate = useNavigate();
  useSwipePreviews();

  const [isSwiping, setIsSwiping] = useState(false);
  const currentSwipeCardRef = useRef<SwipeCardController | null>(null);

  const currentIndex = session.swipes.length;
  const currentTrack = playlist.tracks.at(currentIndex);
  const currentPreview = useTrackPreviewUrl(currentTrack?.external_ids.isrc);

  const hasReachedEnd = currentIndex >= playlist.totalTracks;
  const canUndoOrFinish = !isSwiping && currentIndex > 0;
  const canSwipe = !isSwiping && !hasReachedEnd;

  const triggerSwipe = (direction: SwipeDirection) => {
    if (!currentSwipeCardRef.current || !canSwipe) return;
    setIsSwiping(true);
    currentSwipeCardRef.current.swipe(direction);
  };

  const recordSwipe = (direction: SwipeDirection) => {
    if (!currentTrack || hasReachedEnd) return;
    session.recordSwipe({
      item: currentTrack,
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
            tracks={playlist.tracks.slice(currentIndex, currentIndex + MAX_CARD_STACK_HEIGHT)}
            canSwipe={canSwipe}
            onSwipeStart={() => setIsSwiping(true)}
            onSwipeEnd={recordSwipe}
          />
        ) : (
          <p className="text-center">
            <span className="block">You've reached the end!</span>
            <span className="block text-muted">
              Press <Undo className="inline-block" /> to rewind or{" "}
              <Check className="inline-block" /> to finish.
            </span>
          </p>
        )}
        <SwipeButtons
          onUndo={session.undoSwipe}
          onDislike={() => triggerSwipe("left")}
          onLike={() => triggerSwipe("right")}
          onFinish={() => navigate("review")}
          canUndo={canUndoOrFinish}
          canFinish={canUndoOrFinish}
          canSwipe={canSwipe}
        />
      </div>
      <AudioPlayer url={currentPreview.data?.preview_url} className="w-full max-w-3xl" />
    </div>
  );
};

export default SwipeSongsPage;
