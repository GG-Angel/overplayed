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

  const { total_slots, filled_slots, open_slots, num_waiting } = status;

  return (
    <>
      <div className="flex justify-center items-center gap-0.5 flex-wrap">
        {Array.from({ length: total_slots }).map((_, i) => (
          <User
            key={i}
            className={cn("size-10", i < filled_slots ? "text-muted" : "text-success")}
          />
        ))}
        {num_waiting > 0 && <Plus className="text-destructive" />}
      </div>
      {open_slots > 0 ? (
        <p className="text-sm">
          There {open_slots === 1 ? "is" : "are"} {open_slots} {pluralize("slot", open_slots)}{" "}
          available — claim your spot!
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm">
            No slots are available. {formatCount(num_waiting)} {pluralize("user", num_waiting)}{" "}
            {num_waiting === 1 ? "is" : "are"} in line.
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
