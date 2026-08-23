import StatusCard from "@/components/ui/cards/StatusCard";
import { formatDateTime } from "@/lib/utils";
import type { AccessStatus } from "@/types/queue";
import { Check, Clock, Mail } from "lucide-react";

type AccessStatusCardProps = {
  status: AccessStatus;
  isFreshRequest: boolean;
};

const AccessStatusCard = ({ status, isFreshRequest }: AccessStatusCardProps) => {
  switch (status.status) {
    case "confirmation_pending":
      return (
        <StatusCard
          tone="muted"
          icon={Mail}
          title={isFreshRequest ? "Check Your Inbox" : "Verification Pending"}
        >
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">
              {isFreshRequest
                ? "We've sent a verification email to "
                : "A verification email is waiting for "}
              <span className="text-accent">{status.email}</span>
            </p>
            <p>Follow the link in the email to confirm your request.</p>
          </div>
          <p className="text-muted text-sm">Don't see it? Check your spam folder.</p>
        </StatusCard>
      );

    case "in_queue":
      return (
        <StatusCard tone="muted" icon={Clock} title="Waiting In Queue">
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">
              {status.email} is <span className="text-success">#{status.position_in_queue}</span> in
              line.
            </p>
            <p className="text-muted">
              Access opens at {formatDateTime(status.estimated_start_time)}.
            </p>
          </div>
        </StatusCard>
      );

    case "active":
      return (
        <StatusCard tone="positive" icon={Check} title="Account Activated">
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">{status.email} is in!</p>
            <p className="brightness-80">
              Access is available until {formatDateTime(status.estimated_end_time)}.
            </p>
          </div>
        </StatusCard>
      );
  }
};

export default AccessStatusCard;
