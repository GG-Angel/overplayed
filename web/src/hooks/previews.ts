import { getTrackPreview } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const useTrackPreview = (isrc: string | undefined) =>
  useQuery({
    queryKey: ["preview", isrc],
    queryFn: () => getTrackPreview(isrc!),
    enabled: !!isrc,
  });
