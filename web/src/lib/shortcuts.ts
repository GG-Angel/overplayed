export type Shortcut = {
  keys: string[];
  label: string;
};

export const SWIPE_SHORTCUTS = {
  dislike: { keys: ["arrowleft", "a"], label: "Dislike" },
  like: { keys: ["arrowright", "d"], label: "Like" },
  undo: { keys: ["arrowup", "w"], label: "Undo last swipe" },
  shuffle: { keys: ["s"], label: "Shuffle upcoming tracks" },
} satisfies Record<string, Shortcut>;

export const PREVIEW_SHORTCUTS = {
  playPause: { keys: [" "], label: "Play / pause preview" },
  mute: { keys: ["m"], label: "Mute / unmute preview" },
} satisfies Record<string, Shortcut>;

export const MODAL_SHORTCUTS = {
  close: { keys: ["escape"], label: "Close this menu" },
} satisfies Record<string, Shortcut>;

const KEY_LABELS: Record<string, string> = {
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓",
  " ": "Space",
  escape: "Esc",
};

export function formatShortcutKey(key: string): string {
  return KEY_LABELS[key] ?? key.toUpperCase();
}

export function bindShortcuts<T extends string>(
  shortcuts: Record<T, Shortcut>,
  handlers: Record<T, () => void>
): Record<string, () => void> {
  const actions: Record<string, () => void> = {};

  for (const id of Object.keys(shortcuts) as T[]) {
    for (const key of shortcuts[id].keys) {
      actions[key] = handlers[id];
    }
  }

  return actions;
}
