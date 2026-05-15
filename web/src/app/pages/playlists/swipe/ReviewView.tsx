import TrackCard from "@/components/TrackCard";
import Card from "@/components/ui/Card";
import Metric from "@/components/ui/Metric";
import Checkbox from "@/components/ui/Checkbox";
import { useSwipeContext } from "./SwipeContext";
import { useReviewForm } from "@/hooks/useReviewForm";
import SavePlaylistFields from "./SavePlaylistFIelds";
import Button from "@/components/ui/Button";

const ReviewView = () => {
  const { likes, dislikes } = useSwipeContext();
  const { form, errors, toggleSavePlaylist, updateSavePlaylistFields, validate } = useReviewForm();

  const handleSubmit = () => {
    const result = validate();
    if (!result.success) return;
    console.log("submitting!", result.data);
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <p className="text-2xl font-medium">Review Changes</p>
      <div className="flex gap-3">
        <Metric amount={dislikes.length} label="Dislikes" tone="negative" />
        <Metric amount={likes.length} label="Likes" tone="positive" />
      </div>

      <div>
        <p className="mb-3">The following tracks will be removed:</p>
        <div className="flex flex-col gap-3 max-h-107 overflow-y-auto snap-y snap-mandatory">
          {dislikes.map((item) => (
            <TrackCard
              key={item.track.uri}
              track={item.track}
              orientation="horizontal"
              className="snap-start"
            />
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-1 justify-between items-center gap-4 pr-2">
          <div>
            <p>Save removed tracks to a new playlist?</p>
            <p className="text-sm text-muted-foreground">
              Keep these {dislikes.length} tracks accessible after removal.
            </p>
          </div>
          <Checkbox enabled={form.savePlaylist.enabled} onEnabledChange={toggleSavePlaylist} />
        </div>
        {form.savePlaylist.enabled && (
          <SavePlaylistFields
            name={form.savePlaylist.name}
            description={form.savePlaylist.description}
            errors={errors}
            onChange={updateSavePlaylistFields}
          />
        )}
      </Card>

      <Button variant="secondary" onClick={handleSubmit}>
        Confirm Deletion
      </Button>
    </div>
  );
};

export default ReviewView;
