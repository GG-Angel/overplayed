/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import { useUserStatus } from "../api/access";
import useAuth from "../app/auth";
import { formatDuration } from "../utils";

const TICK_INTERVAL_MS = 30 * 1000;
const LOW_TIME_THRESHOLD_MS = 2 * 60 * 60 * 1000;

export const useAccessCountdown = () => {
  const { user } = useAuth();
  const { data: access, isLoading } = useUserStatus(user?.email);
  const endTime = access?.status === "active" ? access.estimated_end_time : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endTime === null) return;
    const interval = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [endTime]);

  const msLeft = endTime === null ? null : Math.max(0, new Date(endTime).getTime() - now);
  return {
    access,
    isLoading,
    msLeft,
    label: msLeft === null ? null : formatDuration(msLeft),
    isLow: msLeft !== null && msLeft <= LOW_TIME_THRESHOLD_MS,
    isExpired: msLeft === 0,
  };
};

const AccessPill = () => {
  const { access, label, isLow, isExpired } = useAccessCountdown();
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
