import { saveToStorage } from "@/lib/storage";
import { useCallback, useEffect, useRef } from "react";

const DEFAULT_DELAY = 500; // quiet period before a pending write is committed

const useDebouncedStorage = <T>(storage: Storage, key: string, value: T, delay = DEFAULT_DELAY) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingRef = useRef<{ value: T } | null>(null);
  const initialValueRef = useRef(value);

  const flush = useCallback(() => {
    clearTimeout(timeoutRef.current);

    const pending = pendingRef.current;
    if (!pending) return;

    pendingRef.current = null;
    saveToStorage(storage, key, pending.value);
  }, [storage, key]);

  // queue a write, pushing it back on each change until the burst settles
  useEffect(() => {
    // the initial value was just read out of storage, so writing it back is a no-op
    if (value === initialValueRef.current) return;

    pendingRef.current = { value };
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(flush, delay);
  }, [value, delay, flush]);

  // commit anything still pending before the page or the target key goes away
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
      flush();
    };
  }, [flush]);
};

export default useDebouncedStorage;
