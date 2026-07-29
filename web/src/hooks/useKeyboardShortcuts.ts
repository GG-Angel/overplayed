import { useEffect } from "react";
import { bindShortcuts, type Shortcut } from "@/lib/shortcuts";

const useKeyboardShortcuts = <T extends string>(
  shortcuts: Record<T, Shortcut>,
  handlers: Record<T, () => void>,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const actions = bindShortcuts(shortcuts, handlers);

    const handleKeyDown = (e: KeyboardEvent) => {
      const action = actions[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault();
      action();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, handlers, enabled]);
};

export default useKeyboardShortcuts;
