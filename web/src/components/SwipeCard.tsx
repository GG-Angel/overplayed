import { Heart, X } from "lucide-react";
import TrackCard from "./TrackCard";
import type { Track } from "@/lib/types";
import SwipeCardDecisionOverlay from "./SwipeCardDecisionOverlay";

type SwipeCardProps = {
  track: Track;
};

const SwipeCard = ({ track }: SwipeCardProps) => {
  return (
    <div className="relative">
      <SwipeCardDecisionOverlay
        icon={Heart}
        className="text-accent from-accent/50 absolute inset-0"
      />
      <SwipeCardDecisionOverlay
        icon={X}
        className="text-destructive from-destructive/50 absolute inset-0"
      />
      <TrackCard track={track} />
    </div>
  );
};

export default SwipeCard;
