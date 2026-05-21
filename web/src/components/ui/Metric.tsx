import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Card from "./Card";

const metricVariants = cva(
  "flex flex-1 flex-col justify-center items-center font-medium select-none",
  {
    variants: {
      tone: {
        neutral: "",
        muted: "bg-card/40 border-card-border/40",
        negative: "text-destructive bg-destructive/5 border-destructive/10",
        positive: "text-primary bg-primary/5 border-primary/10",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

type MetricProps = VariantProps<typeof metricVariants> & {
  amount: number;
  label: string;
  className?: string;
};

const Metric = ({ amount, label, tone, className }: MetricProps) => (
  <Card className={cn(metricVariants({ tone }), className)}>
    <p className="text-sm text-current/60">{label}</p>
    <p className="text-4xl">{amount}</p>
  </Card>
);

export default Metric;
