import { cn } from "@/lib/utils";

type WaveformSkeletonProps = { className?: string; message?: string };

const WaveformSkeleton = ({ className, message }: WaveformSkeletonProps) => (
  <div
    className={cn(
      "rounded-md bg-card-border flex justify-center items-center text-muted-foreground",
      className
    )}
  >
    {message}
  </div>
);

export default WaveformSkeleton;
