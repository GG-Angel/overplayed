import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils";
import { useUserAccess } from "../api/get-user-access";

// the api hands back an absolute end time, so the countdown is derived
// locally and only needs to re-render often enough to keep minutes honest
const TICK_INTERVAL_MS = 30 * 1000; // 30 seconds
const LOW_TIME_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

const useAccessCountdown = () => {
  const { data: access, isLoading } = useUserAccess();
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

export default useAccessCountdown;
