import type { QueueAccessRequest } from "@/lib/types";
import {
  useCallback,
  useMemo,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";

export const localStorageConfig = {
  accessForm: {
    key: "access-request-form",
    default: {
      email: "",
    } satisfies QueueAccessRequest,
  },
  hasRequestedAccess: {
    key: "has-requested-access",
    default: false,
  },
  volume: {
    key: "volume",
    default: 0.3,
  },
} as const;

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

const read = <T>(key: string, initialValue: T): T => {
  const raw = localStorage.getItem(key);
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = initialValue;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initialValue;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
};

const emit = (key: string) => listeners.get(key)?.forEach((listener) => listener());

const subscribe = (key: string) => (listener: Listener) => {
  const keyListeners = listeners.get(key) ?? new Set<Listener>();
  listeners.set(key, keyListeners);
  keyListeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
};

const useLocalStorage = <T>(key: string, initialValue: T) => {
  const value = useSyncExternalStore(
    useMemo(() => subscribe(key), [key]),
    () => read(key, initialValue)
  );

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (update) => {
      const next =
        typeof update === "function" ? (update as (prev: T) => T)(read(key, initialValue)) : update;
      localStorage.setItem(key, JSON.stringify(next));
      emit(key);
    },
    [key, initialValue]
  );

  return [value, setValue] as const;
};

export default useLocalStorage;
