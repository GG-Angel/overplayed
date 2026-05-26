import { cn } from "@/lib/utils";
import { Ellipsis, LoaderCircle, Check, Ban, X } from "lucide-react";
import type { StepStatus } from "../hooks/useSwipeSubmit";

const StatusStyles = {
  pending: {
    icon: Ellipsis,
    iconClassName: "text-muted-foreground animate-pulse",
  },
  active: {
    icon: LoaderCircle,
    iconClassName: "animate-spin",
  },
  success: {
    icon: Check,
    iconClassName: "text-primary",
  },
  skipped: {
    icon: Ban,
    iconClassName: "text-muted-foreground",
  },
  error: {
    icon: X,
    iconClassName: "text-destructive",
  },
};

type SwipeSubmitStepProps = {
  label: string;
  status: StepStatus;
};

const SwipeSubmitStep = ({ label, status }: SwipeSubmitStepProps) => {
  const { icon: Icon, iconClassName } = StatusStyles[status];
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("inline-block", iconClassName)} />
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
};

export default SwipeSubmitStep;
