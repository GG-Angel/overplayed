import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
