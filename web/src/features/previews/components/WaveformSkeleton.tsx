import { cn } from "@/lib/utils";

type WaveformSkeletonProps = { pulse?: boolean; className?: string; message?: string };

const WaveformSkeleton = ({ className, message, pulse = false }: WaveformSkeletonProps) => (
  <div
    className={cn(
      "rounded-md bg-card-border flex justify-center items-center text-muted",
      pulse && "animate-pulse",
      className
    )}
  >
    {message}
  </div>
);

export default WaveformSkeleton;
