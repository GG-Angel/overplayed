import TrackCard from "@/components/TrackCard";
import Card from "@/components/ui/Card";
import Metric from "@/components/ui/Metric";
import Checkbox from "@/components/ui/Checkbox";
import { useSwipeContext } from "./SwipeContext";
import { useReviewForm, type ReviewForm } from "@/hooks/useReviewForm";
import Button from "@/components/ui/Button";

type ReviewViewProps = {
  onBack?: () => void;
  onSubmit?: (form: ReviewForm) => void;
};

const ReviewView = ({ onBack, onSubmit }: ReviewViewProps) => {
  const { likes, dislikes } = useSwipeContext();
  const { form, toggleSavePlaylist, validate } = useReviewForm();

  const formatCount = (label: string, amount: number) => {
    return `${label}${amount > 1 ? "s" : ""}`;
  };

  const handleBack = () => {
    onBack?.();
  };

  const handleSubmit = () => {
    const result = validate();
    if (!result.success) return;
    onSubmit?.(form);
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <p className="text-2xl font-medium">Review Changes</p>
      <div className="flex gap-3">
        <Metric
          amount={dislikes.length}
          label={formatCount("Dislike", dislikes.length)}
          tone="negative"
        />
        <Metric amount={likes.length} label={formatCount("Like", likes.length)} tone="positive" />
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
        <Button variant="secondary" onClick={handleBack}>
          Keep Swiping
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Confirm Deletion
        </Button>
      </div>
    </div>
  );
};

export default ReviewView;
