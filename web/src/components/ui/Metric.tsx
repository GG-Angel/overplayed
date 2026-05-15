import { cn } from "@/lib/utils";
import Card from "./Card";

type MetricProps = {
  amount: number;
  label: string;
  className?: string;
};

const Metric = ({ amount, label, className }: MetricProps) => (
  <Card className={cn("flex flex-1 flex-col justify-center items-center", className)}>
    <p className="text-4xl font-medium">{amount}</p>
    <p className="text-sm">{label}</p>
  </Card>
);

export default Metric;
