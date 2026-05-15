import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Image } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function openExternalUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function extractImageUrl(images: Image[], size: "sm" | "lg"): string {
  const index = size === "sm" ? -1 : 0;
  return images.at(index)?.url ?? "/placeholder.webp";
}
