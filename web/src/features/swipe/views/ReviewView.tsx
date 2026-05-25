import Card from "@/components/ui/Card";
import Metric from "@/components/ui/Metric";
import Checkbox from "@/components/ui/Checkbox";
import { useSwipeContext } from "../context/SwipeContext";
import { useReviewForm } from "@/features/swipe/hooks/useReviewForm";
import Button from "@/components/ui/Button";
import { pluralize } from "@/lib/utils";
import TrackCard from "@/features/playlist/components/TrackCard";

const ReviewView = () => {
  const { likes, dislikes, back, submit } = useSwipeContext();
  const { form, toggleSavePlaylist } = useReviewForm();

  return (
    <div className="flex flex-col gap-6 py-2">
      <p className="text-2xl font-medium">Review Changes</p>
      <div className="flex gap-3">
        <Metric
          amount={dislikes.length}
          label={pluralize("Dislike", dislikes.length)}
          tone="negative"
        />
        <Metric amount={likes.length} label={pluralize("Like", likes.length)} tone="positive" />
      </div>

      <div>
        <p className="mb-3">The following tracks will be removed:</p>
        <div className="flex flex-col gap-3 max-h-107 overflow-y-auto snap-y snap-mandatory">
          {dislikes.map((item) => (
            <TrackCard
              key={item.track.uri}
              track={item.track}
              orientation="horizontal"
              size="sm"
              className="snap-start"
            />
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-1 justify-between items-center gap-4 pr-2">
          <div>
            <p>Save removed tracks to a new playlist?</p>
            {form.savePlaylist ? (
              <p className="text-sm text-muted-foreground">
                Keep these tracks accessible after removal.
              </p>
            ) : (
              <p className="text-sm text-destructive">Removed tracks will be lost permanently.</p>
            )}
          </div>
          <Checkbox enabled={form.savePlaylist} onEnabledChange={toggleSavePlaylist} />
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={back}>
          Keep Swiping
        </Button>
        <Button variant="primary" onClick={() => submit(form)}>
          Confirm Deletion
        </Button>
      </div>
    </div>
  );
};

export default ReviewView;
