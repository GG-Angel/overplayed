import DropdownMenuItem from "@/components/ui/dropdown/DropdownMenuItem";
import { cn } from "@/lib/utils";
import type { QueueUserAccess } from "@/lib/types";
import { Hourglass } from "lucide-react";
import useAccessCountdown from "../hooks/useAccessCountdown";

const describeAccess = (access: QueueUserAccess, label: string | null, isExpired: boolean) => {
  switch (access.status) {
    case "active":
      return isExpired ? "Access expired" : `Access · ${label} left`;
    case "in_queue":
      return `#${access.position_in_queue} in line`;
    case "not_in_queue":
      return "No access";
  }
};

const AccessStatus = () => {
  const { access, isLoading, label, isLow, isExpired } = useAccessCountdown();

  if (isLoading || !access) return null;

  return (
    <DropdownMenuItem className="text-xs text-muted">
      <Hourglass className={cn("size-3.5 shrink-0", isLow && "text-destructive")} />
      <span className={cn("truncate", isLow && "text-destructive font-medium")}>
        {describeAccess(access, label, isExpired)}
      </span>
    </DropdownMenuItem>
  );
};

export default AccessStatus;
