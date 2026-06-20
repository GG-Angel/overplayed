import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Divider from "@/components/ui/Divider";
import Metric from "@/components/ui/Metric";
import TrackCard from "@/features/playlist/components/TrackCard";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import useConfetti from "@/hooks/useConfetti";
import { kaomojis } from "@/lib/kaomoji";
import { LIKED_SONGS_ID } from "@/lib/types";
import { formatCount, pluralize } from "@/lib/utils";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SwipeReviewPage = () => {
  const { playlist, session, options, setOptions } = useSwipeContext();
  const navigate = useNavigate();

  const toggleBackup = useCallback(
    () => setOptions((prev) => ({ ...prev, backup_enabled: !prev.backup_enabled })),
    [setOptions]
  );

  const toggleRemoveFromLikes = useCallback(
    () => setOptions((prev) => ({ ...prev, remove_from_likes: !prev.remove_from_likes })),
    [setOptions]
  );

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipe = () => navigate("..");
  const navigateToSubmit = () => navigate("../submit");

  useConfetti({ enabled: session.swipes.length > 0 && session.dislikes.length === 0 });

  if (session.swipes.length === 0) {
    return (
      <MessageState
        kaomoji={kaomojis.uncertain}
        title="No Tracks Swiped"
        subtitle={<p>You haven't swiped on any tracks...</p>}
        actions={
          <>
            <Button variant="secondary" onClick={navigateHome}>
              Return Home
            </Button>
            <Button variant="primary" onClick={navigateToSwipe}>
              Swipe Tracks
            </Button>
          </>
        }
      />
    );
  }

  if (session.dislikes.length === 0) {
    return (
      <MessageState
        kaomoji={kaomojis.proud}
        title="Nothing to Remove!"
        tone="positive"
        subtitle={
          <>
            <p>You kept every track, so your playlist stays as is.</p>
            <p className="text-sm text-muted">(your playlist must be really good)</p>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={navigateToSwipe}>
              Keep Swiping
            </Button>
            <Button variant="primary" onClick={navigateHome}>
              Return Home
            </Button>
          </>
        }
      />
    );
  }

  return (
    <main className="flex flex-col gap-6 py-2 w-full max-w-4xl self-center">
      <h1 className="text-center">Review Swipes</h1>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <Metric
          amount={formatCount(session.dislikes.length)}
          label={pluralize("Dislike", session.dislikes.length)}
          tone="negative"
        />
        <Metric
          amount={formatCount(session.likes.length)}
          label={pluralize("Like", session.likes.length)}
          tone="positive"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h3>The following tracks will be removed:</h3>
        <div className="flex flex-col gap-3 snap-y snap-mandatory *:snap-start max-h-124 overflow-y-auto">
          {session.dislikes.map((track) => (
            <TrackCard
              key={track.uri}
              track={track}
              orientation="horizontal"
              className="snap-start"
            />
          ))}
        </div>
      </div>
      <Divider />
      <div className="flex flex-col gap-3">
        <h3>Options</h3>
        <Card
          className="flex justify-between items-center gap-4 pr-6 py-3 cursor-pointer select-none"
          onClick={toggleBackup}
        >
          <div>
            <p>Back up removed tracks?</p>
            {options.backup_enabled ? (
              <p className="text-sm text-muted">Saves removed tracks to a new playlist.</p>
            ) : (
              <p className="text-sm text-destructive">Removed tracks will be lost permanently.</p>
            )}
          </div>
          <Checkbox enabled={options.backup_enabled} onEnabledChange={undefined} />
        </Card>
        {playlist.metadata.id !== LIKED_SONGS_ID && (
          <Card
            className="flex justify-between items-center gap-4 pr-6 py-3 cursor-pointer select-none"
            onClick={toggleRemoveFromLikes}
          >
            <div>
              <p>Remove from liked songs?</p>
              {options.remove_from_likes ? (
                <p className="text-sm text-destructive">
                  Tracks will also be removed from liked songs.
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Tracks will only be removed from the current playlist.
                </p>
              )}
            </div>
            <Checkbox enabled={options.remove_from_likes} onEnabledChange={undefined} />
          </Card>
        )}
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:w-fit sm:self-end">
        <Button variant="secondary" onClick={navigateToSwipe}>
          Keep Swiping
        </Button>
        <Button variant="primary" onClick={navigateToSubmit}>
          Confirm Deletion
        </Button>
      </div>
    </main>
  );
};

export default SwipeReviewPage;
