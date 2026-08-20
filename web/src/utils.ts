import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Image } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function openExternalUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function fallbackImageUrl(url: string | null | undefined): string {
  return url ?? "/placeholder.webp";
}

export function extractImageUrl(images: Image[], size: "sm" | "lg"): string {
  const index = size === "sm" ? -1 : 0;
  return fallbackImageUrl(images.at(index)?.url);
}

export function pluralize(label: string, amount: number): string {
  return `${label}${amount === 1 ? "" : "s"}`;
}

export function formatPercentage(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatCount(n: number): string {
  if (n < 1000) {
    return n.toString();
  }

  if (n < 1_000_000) {
    return `${(n / 1000).toFixed(2)}k`;
  }

  return `${(n / 1_000_000).toFixed(1)}m`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (totalMinutes > 0) return `${totalMinutes}m`;
  return "<1m";
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function wrapSlice<T>(arr: T[], start: number, end: number): T[] {
  const len = arr.length;
  const actualStart = start % len;

  if (actualStart + (end - start) > len) {
    return [...arr.slice(actualStart), ...arr.slice(0, (actualStart + end - start) % len)];
  }

  return arr.slice(actualStart, actualStart + (end - start));
}

export const kaomojis = {
  uncertain: "(￣～￣;)",
  stressed: "(ᵕ ó ᴗ ò)",
  proud: "ദ്ദി(｡•̀ ,<)~✩‧₊",
  working: "ᕙ(  •̀ ᗜ •́  )ᕗ",
} as const;
