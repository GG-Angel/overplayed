import api from "./api-client";
import { type SwipeSessionDetails } from "./types";

export const buildURLWithParams = (
  url: string,
  params?: Record<string, string | number>
): string => {
  if (!params) return url;
  const paramsString = new URLSearchParams(params as Record<string, string>).toString();
  return `${url}?${paramsString}`;
};

export const logSwipeSession = async (data: SwipeSessionDetails) => {
  await api.post(`/metrics/swipe-sessions`, data);
};
