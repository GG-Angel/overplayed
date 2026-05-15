import TrackCard from "@/components/TrackCard";
import { useSwipeContext } from "./SwipeContext";
import Metric from "@/components/ui/Metric";

// confirmation page
// megumin thumbs up image
// you just cleaned up 75% of your playlist!
// [ view playlist ] [ return to home ]

// processing page
// Confirming changes...
// [ ] Creating new playlist...
// [ ] Adding tracks...
// [ ] Removing tracks...

const ReviewView = () => {
  const { likes, dislikes } = useSwipeContext();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl font-medium">Review Changes</p>
      <div className="flex gap-3">
        <Metric
          amount={dislikes.length}
          label="Dislikes"
          className="text-destructive bg-destructive/5 border-destructive/10"
        />
        <Metric
          amount={likes.length}
          label="Likes"
          className="text-primary bg-primary/5 border-primary/10"
        />
      </div>
      <p>The following tracks will be removed:</p>
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
  );
};

export default ReviewView;
