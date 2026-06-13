import { cn } from "@/lib/utils";
import { Heart, X } from "lucide-react";

type SwipeProgressProps = {
  likes: number;
  dislikes: number;
  total: number;
  className?: string;
};

const SwipeProgress = ({ likes, dislikes, total, className }: SwipeProgressProps) => {
  const toPercent = (value: number) => (total > 0 ? (value / total) * 100 : 0);
  const remaining = Math.max(total - likes - dislikes, 0);

  const segments = [
    { key: "dislikes", width: toPercent(dislikes), className: "bg-destructive" },
    {
      key: "likes",
      width: toPercent(likes),
      className: "bg-primary",
      style: { marginLeft: dislikes > 0 ? "2px" : "0" },
    },
  ];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2">
        <p className="text-destructive min-w-12 text-right text-sm">{dislikes}</p>
        <X className="text-destructive" />
        <div
          className="flex mx-2 h-1 w-full overflow-hidden rounded-full bg-card"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={likes + dislikes}
          aria-label="Swipe progress"
        >
          {segments.map(({ key, width, style, className }) => (
            <div
              key={key}
              className={`h-full rounded transition-all duration-300 ${className}`}
              style={{ width: `${width}%`, ...style }}
            />
          ))}
        </div>
        <Heart className="size-4.75 text-primary" />
        <p className="text-primary min-w-12 text-left text-sm">{likes}</p>
      </div>
      <p className="text-center text-sm text-muted">{remaining} left</p>
    </div>
  );
};

export default SwipeProgress;
