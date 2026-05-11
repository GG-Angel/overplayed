import { get, routes } from "@/lib/api";

export const getTrackPreview = async (isrc: string) =>
  await get<{ preview: string }>(routes.previews(isrc));
