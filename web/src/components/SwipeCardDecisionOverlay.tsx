import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SwipeCardDecisionOverlay = {
  icon: LucideIcon;
  opacity?: number;
  className?: string;
};

const SwipeCardDecisionOverlay = ({
  icon: Icon,
  opacity = 1,
  className = "",
}: SwipeCardDecisionOverlay) => (
  <div
    style={{ opacity }}
    className={cn("flex justify-center items-center bg-linear-to-t rounded-xl", className)}
  >
    <Icon
      fill="currentColor"
      fillOpacity={0.6}
      className="drop-shadow-black drop-shadow-lg size-1/3"
    />
  </div>
);

export default SwipeCardDecisionOverlay;
