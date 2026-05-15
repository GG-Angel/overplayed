import TrackCard from "@/components/TrackCard";
import Card from "@/components/ui/Card";
import Metric from "@/components/ui/Metric";
import { useState } from "react";
import { useSwipeContext } from "./SwipeContext";
import Checkbox from "@/components/ui/Checkbox";

type ReviewForm = {
  savePlaylist: {
    enabled: boolean;
    name: string;
    description: string;
  };
};

const ReviewView = () => {
  const { likes, dislikes } = useSwipeContext();
  const [form, setForm] = useState<ReviewForm>({
    savePlaylist: { enabled: true, name: "Overplayed", description: "Your removed tracks :3" },
  });

  const updateSavePlaylist = (patch: Partial<ReviewForm["savePlaylist"]>) =>
    setForm((prev) => ({
      ...prev,
      savePlaylist: { ...prev.savePlaylist, ...patch },
    }));

  return (
    <div className="flex flex-col gap-6 py-2">
      <h1 className="text-2xl font-medium">Review Changes</h1>

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

      <Card className="flex flex-col gap-2">
        <div className="flex flex-1 justify-between items-center gap-4 pr-2">
          <div>
            <p>Save removed tracks to a new playlist?</p>
            <p className="text-sm text-muted-foreground">
              Keep these {dislikes.length} tracks accessible after removal.
            </p>
          </div>
          <Checkbox
            enabled={form.savePlaylist.enabled}
            onEnabledChange={() => updateSavePlaylist({ enabled: !form.savePlaylist.enabled })}
          />
        </div>
        {form.savePlaylist.enabled && <div>hi</div>}
      </Card>
    </div>
  );
};

export default ReviewView;
