import Skeleton from "@/components/ui/Skeleton";
import { cn, formatCount, formatDateTime, pluralize } from "@/lib/utils";
import type { QueueStatus } from "@/types/queue";
import { Plus, User } from "lucide-react";

type AvailabilityMeterProps = {
  status: QueueStatus | undefined;
};

const AvailabilityMeter = ({ status }: AvailabilityMeterProps) => {
  if (!status) {
    return <Skeleton radius="lg" className="w-full max-w-sm self-center h-18" />;
  }

  const total = status.num_active + status.num_queued;
  const active = Math.min(total, status.user_limit);
  const empty = Math.max(0, status.user_limit - active);
  const waiting = Math.max(0, total - status.user_limit);

  return (
    <>
      <div className="flex justify-center items-center gap-0.5 flex-wrap">
        {Array.from({ length: status.user_limit }).map((_, i) => (
          <User key={i} className={cn("size-10", i < active ? "text-muted" : "text-success")} />
        ))}
        {waiting > 0 && <Plus className="text-destructive" />}
      </div>
      {empty > 0 ? (
        <p className="text-sm">
          There {empty === 1 ? "is" : "are"} {empty} {pluralize("slot", empty)} available — claim
          your spot!
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm">
            No slots are available. {formatCount(waiting)} {pluralize("user", waiting)}{" "}
            {waiting === 1 ? "is" : "are"} in line.
          </p>
          {status.next_available_time && (
            <p className="text-xs text-muted">
              Earliest available time: {formatDateTime(status.next_available_time)}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default AvailabilityMeter;
