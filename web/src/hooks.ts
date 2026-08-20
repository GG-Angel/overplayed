import confetti from "canvas-confetti";
import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from "react";
import { useBlocker } from "react-router-dom";
import { bindShortcuts, type Shortcut } from "./shortcuts";
import { saveToStorage } from "./storage";

export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true
): RefObject<T | null> => {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = elementRef.current;
      if (!element || element.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler, enabled]);

  return elementRef;
};

export const useKeyboardShortcuts = <T extends string>(
  shortcuts: Record<T, Shortcut>,
  handlers: Record<T, () => void>,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const actions = bindShortcuts(shortcuts, handlers);
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = actions[event.key.toLowerCase()];
      if (!action) return;
      event.preventDefault();
      action();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, handlers, enabled]);
};

export const useNavBlocker = (when: boolean, allowedPathPrefix: string) =>
  useBlocker(({ nextLocation }) => when && !nextLocation.pathname.startsWith(allowedPathPrefix));

const DEFAULT_STORAGE_DELAY = 500;

export const useDebouncedStorage = <T>(
  storage: Storage,
  key: string,
  value: T,
  delay = DEFAULT_STORAGE_DELAY
) => {
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

  useEffect(() => {
    if (value === initialValueRef.current) return;
    pendingRef.current = { value };
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(flush, delay);
  }, [value, delay, flush]);

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

export const useConfetti = ({ enabled = true }: { enabled: boolean }) => {
  useEffect(() => {
    if (!enabled) return;
    const common = { particleCount: 35, spread: 55, colors: ["#1ed760"] };
    confetti({ ...common, angle: 60, origin: { x: 0 } });
    confetti({ ...common, angle: 120, origin: { x: 1 } });
  }, [enabled]);
};
