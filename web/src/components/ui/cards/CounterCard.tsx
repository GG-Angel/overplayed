import { cn } from "@/lib/utils";
import Skeleton from "../Skeleton";
import Card, { type CardProps } from "./Card";

type CounterCardSkeletonProps = Pick<CardProps, "className" | "tone">;

type CounterCardProps = CardProps & {
  amount: number | string;
  label: string;
  className?: string;
};

export const CounterCardSkeleton = ({ className, ...props }: CounterCardSkeletonProps) => {
  return <Skeleton className={cn("h-23.75", className)} {...props} />;
};

const CounterCard = ({ amount, label, className, ...props }: CounterCardProps) => (
  <Card className={cn("flex flex-1 flex-col justify-center items-center", className)} {...props}>
    <p className="text-sm font-medium text-current/60">{label}</p>
    <data className="text-4xl tracking-tight font-semibold" value={amount}>
      {amount}
    </data>
  </Card>
);

export default CounterCard;
