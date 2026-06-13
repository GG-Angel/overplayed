import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Metric from "@/components/ui/Metric";
import TrackCard from "@/features/playlist/components/TrackCard";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import { kaomojis } from "@/lib/kaomoji";
import { formatCount, pluralize } from "@/lib/utils";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SwipeReviewPage = () => {
  const { session, options, setOptions } = useSwipeContext();
  const navigate = useNavigate();

  const handleBackupToggle = useCallback(
    () => setOptions((prev) => ({ ...prev, backup_enabled: !prev.backup_enabled })),
    [setOptions]
  );

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipePage = () => navigate("..");
  const navigateToSwipeSubmit = () => navigate("../submit");

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
            <Button variant="primary" onClick={navigateToSwipePage}>
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
            <Button variant="secondary" onClick={navigateToSwipePage}>
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
    <div className="flex flex-col gap-6 py-2 w-full max-w-4xl self-center">
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
        <div className="flex flex-col gap-3 max-h-107 overflow-y-auto snap-y snap-mandatory">
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
      <Card className="flex justify-between items-center gap-4 pr-6 py-3">
        <div>
          <p>Back up removed tracks?</p>
          {options.backup_enabled ? (
            <p className="text-sm text-muted">Saves removed tracks to a new playlist.</p>
          ) : (
            <p className="text-sm text-destructive">Removed tracks will be lost permanently.</p>
          )}
        </div>
        <Checkbox enabled={options.backup_enabled} onEnabledChange={handleBackupToggle} />
      </Card>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:w-fit sm:self-end">
        <Button variant="secondary" onClick={navigateToSwipePage}>
          Keep Swiping
        </Button>
        <Button variant="primary" onClick={navigateToSwipeSubmit}>
          Confirm Deletion
        </Button>
      </div>
    </div>
  );
};

export default SwipeReviewPage;
