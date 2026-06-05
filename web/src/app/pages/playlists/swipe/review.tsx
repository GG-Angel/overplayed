import MessageState from "@/components/states/MessageState";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Metric from "@/components/ui/Metric";
import TrackCard from "@/features/playlist/components/TrackCard";
import { useSwipeContext } from "@/features/swipe/provider/SwipeContext";
import { formatCount, pluralize } from "@/lib/utils";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SwipeReviewPage = () => {
  const { session, options, setOptions } = useSwipeContext();
  const navigate = useNavigate();

  const handleBackupToggle = useCallback(
    () => setOptions((prev) => ({ ...prev, backupEnabled: !prev.backupEnabled })),
    [setOptions]
  );

  const navigateHome = () => navigate("/", { replace: true });
  const navigateToSwipePage = () => navigate("..");
  const navigateToSwipeSubmit = () => navigate("../submit");

  if (session.swipes.length === 0) {
    return (
      <MessageState
        kaomoji="(ᵕ • ㅁ •)"
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
        kaomoji="ദ്ദി(｡•̀ ,<)~✩‧₊"
        title="Nothing to Remove!"
        subtitle={
          <>
            <p>You kept every track, so your playlist stays as is.</p>
            <p className="text-sm text-muted-foreground">(your playlist must be really good)</p>
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
      <p className="text-2xl font-medium">Review Changes</p>
      <div className="flex gap-3">
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
      <div>
        <p className="mb-3">The following tracks will be removed:</p>
        <div className="flex flex-col gap-3 max-h-107 overflow-y-auto snap-y snap-mandatory">
          {session.dislikes.map((track) => (
            <TrackCard
              key={track.uri}
              track={track}
              orientation="horizontal"
              size="sm"
              className="snap-start"
            />
          ))}
        </div>
      </div>
      <Card className="flex justify-between items-center gap-4 pr-6">
        <div>
          <p>Back up removed tracks?</p>
          {options.backupEnabled ? (
            <p className="text-sm text-muted-foreground">Saves removed tracks to a new playlist.</p>
          ) : (
            <p className="text-sm text-destructive">Removed tracks will be lost permanently.</p>
          )}
        </div>
        <Checkbox enabled={options.backupEnabled} onEnabledChange={handleBackupToggle} />
      </Card>
      <div className="flex justify-end gap-3">
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
