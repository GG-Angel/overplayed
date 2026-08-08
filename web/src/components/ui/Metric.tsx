import { cn } from "@/lib/utils";
import Card, { type CardProps } from "./Card";

type MetricProps = CardProps & {
  amount: number | string;
  label: string;
  className?: string;
};

const Metric = ({ amount, label, className, ...props }: MetricProps) => (
  <Card className={cn("flex flex-1 flex-col justify-center items-center", className)} {...props}>
    <p className="text-sm font-medium text-current/60">{label}</p>
    <data className="text-4xl tracking-tight font-semibold" value={amount}>
      {amount}
    </data>
  </Card>
);

type MetricSkeletonProps = Pick<CardProps, "className" | "tone">;

export const MetricSkeleton = ({ className, ...props }: MetricSkeletonProps) => {
  return <Card className={cn("animate-pulse h-23.75", className)} {...props} />;
};

export default Metric;
