export const storageKeys = {
  accessForm: "access-request-form",
  hasRequestedAccess: "has-requested-access",
  volume: "volume",
  swipes: (playlistId: string, snapshotId: string) => `swipes-${playlistId}-${snapshotId}`,
} as const;

export function loadFromStorage<T>(storage: Storage, key: string, defaultValue: T): T {
  const value = storage.getItem(key);
  if (value === null) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    console.error(`Failed to parse localStorage value for key "${key}": ${value}`);
    return defaultValue;
  }
}

export function saveToStorage<T>(storage: Storage, key: string, value: T): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(`Failed to save to localStorage for key "${key}": ${value}`);
  }
}

export function removeFromStorage(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    console.error(`Failed to remove from localStorage for key "${key}"`);
  }
}
