import { useTrackPreviewUrl } from "@/features/previews/api/get-track-preview";
import AudioPlayer from "@/features/previews/components/PreviewPlayer";
import SwipeButtons from "@/features/swipe/components/SwipeButtons";
import type { SwipeCardController, SwipeDirection } from "@/features/swipe/components/SwipeCard";
import SwipeCardStack from "@/features/swipe/components/SwipeCardStack";
import SwipeProgress from "@/features/swipe/components/SwipeProgress";
import ShortcutsHelp from "@/features/swipe/components/ShortcutsHelp";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import { SWIPE_SHORTCUTS } from "@/lib/shortcuts";
import { Check, Shuffle, Undo } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useDebouncedStorage from "@/hooks/useDebouncedStorage";
import { storageKeys } from "@/lib/storage";
import usePreloadSwipePreviews from "@/features/swipe/hooks/usePreloadSwipePreviews";
import PillButton from "@/components/ui/PillButton";

const MAX_CARD_STACK_HEIGHT = 3; // maximum number of cards to display in the stack

const SwipeSongsPage = () => {
  const { session, playlist, tracks, shuffle, currentIndex, hasLoadedAllTracks } =
    useSwipeContext();
  usePreloadSwipePreviews(tracks, currentIndex);
  const [isSwiping, setIsSwiping] = useState(false);
  const currentSwipeCardRef = useRef<SwipeCardController | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const navigate = useNavigate();

  const currentTrack = tracks.at(currentIndex);
  const currentPreview = useTrackPreviewUrl(currentTrack?.external_ids.isrc);
  const hasReachedEnd = currentIndex >= tracks.length;
  const canUndoOrFinish = !isSwiping && currentIndex > 0;
  const canSwipe = !isSwiping && !hasReachedEnd;

  const handleShuffle = useCallback(() => {
    if (!hasLoadedAllTracks) return;
    shuffle();
    setShuffleCount((prev) => prev + 1);
  }, [hasLoadedAllTracks, shuffle]);

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentSwipeCardRef.current || !canSwipe) return;
      setIsSwiping(true);
      currentSwipeCardRef.current.swipe(direction);
    },
    [canSwipe]
  );

  const recordSwipe = (direction: SwipeDirection) => {
    if (!currentTrack || hasReachedEnd) return;
    session.recordSwipe({
      item: currentTrack,
      decision: direction === "left" ? "dislike" : "like",
    });
    setIsSwiping(false);
  };

  // handle keyboard events for swiping and undoing
  useKeyboardShortcuts(
    SWIPE_SHORTCUTS,
    {
      dislike: () => triggerSwipe("left"),
      like: () => triggerSwipe("right"),
      undo: session.undoSwipe,
      shuffle: handleShuffle,
    },
    !isShortcutsModalOpen
  );

  // persist swipes in case the user refreshes or leaves the page
  useDebouncedStorage(
    sessionStorage,
    storageKeys.swipes(playlist.id, playlist.snapshot_id),
    session.swipes
  );

  return (
    <main className="flex flex-col items-center gap-4 w-full self-center h-full py-6 overflow-x-hidden overflow-y-auto">
      <SwipeProgress
        className="w-full max-w-3xl"
        likes={session.likes.length}
        dislikes={session.dislikes.length}
        total={playlist.tracks.total}
      />
      <div className="flex-1 flex flex-col w-full items-center justify-center gap-6 shrink-0 py-4">
        {!hasReachedEnd ? (
          <SwipeCardStack
            topCardRef={currentSwipeCardRef}
            tracks={tracks.slice(currentIndex, currentIndex + MAX_CARD_STACK_HEIGHT)}
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
        <div className="flex flex-col items-center gap-3">
          <SwipeButtons
            onUndo={session.undoSwipe}
            onDislike={() => triggerSwipe("left")}
            onLike={() => triggerSwipe("right")}
            onFinish={() => navigate("review")}
            canUndo={canUndoOrFinish}
            canFinish={canUndoOrFinish}
            canSwipe={canSwipe}
          />
          <div className="flex items-center gap-2">
            <PillButton
              onClick={handleShuffle}
              icon={Shuffle}
              disabled={!hasLoadedAllTracks}
              shortcut={{ key: "shuffle", triggers: shuffleCount }}
            >
              Shuffle
            </PillButton>
            <ShortcutsHelp
              open={isShortcutsModalOpen}
              onOpen={() => setIsShortcutsModalOpen(true)}
              onClose={() => setIsShortcutsModalOpen(false)}
            />
          </div>
        </div>
      </div>
      <AudioPlayer
        preview={currentPreview.data}
        isLoading={currentPreview.isLoading}
        isError={currentPreview.isError}
        className="w-full max-w-3xl"
        shortcutsEnabled={!isShortcutsModalOpen}
      />
    </main>
  );
};

export default SwipeSongsPage;
