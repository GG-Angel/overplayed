import TrackCard from "@/components/TrackCard";
import { useSwipeContext } from "./SwipeContext";

const ReviewView = () => {
  const { dislikes } = useSwipeContext();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl font-medium">Review Changes</p>
      <div className="flex flex-col gap-2">
        <p>
          The following tracks will be <span className="text-destructive">removed:</span>
        </p>
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto snap-y snap-mandatory">
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
    </div>
  );
};

export default ReviewView;
