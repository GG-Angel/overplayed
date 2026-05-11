import { useQuery } from "@tanstack/react-query";
import { getTrackPreview } from "./api";

export const useTrackPreview = (isrc: string | undefined) =>
  useQuery({
    queryKey: ["preview", isrc],
    queryFn: () => getTrackPreview(isrc!),
    enabled: !!isrc,
  });
