import { Hourglass } from "lucide-react";
import useAccessCountdown from "../hooks/useAccessCountdown";

const AccessPill = () => {
  const { access, label, isLow, isExpired } = useAccessCountdown();

  // stay out of the way until the access window is nearly up
  if (access?.status !== "active" || !isLow) return null;

  return (
    <div
      className="flex items-center gap-1.5 shrink-0 rounded-full border border-destructive/50 px-2.5 py-1 text-xs font-medium text-destructive"
      title={isExpired ? "Your access has expired" : `${label} of access left`}
    >
      <Hourglass className="size-3.5 shrink-0" />
      {isExpired ? "Expired" : label}
    </div>
  );
};

export default AccessPill;
