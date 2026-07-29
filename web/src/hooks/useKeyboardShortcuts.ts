import { useEffect } from "react";

const useKeyboardShortcuts = (actions: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = actions[e.key.toLowerCase()];
      if (!action) return;
      e.preventDefault();
      action();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
};

export default useKeyboardShortcuts;
