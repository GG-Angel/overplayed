import { cn } from "@/lib/utils";
import Card, { type CardProps } from "./cards/Card";

export type SkeletonProps = CardProps;

const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <Card className={cn("animate-pulse", className)} {...props} />
);

export default Skeleton;
