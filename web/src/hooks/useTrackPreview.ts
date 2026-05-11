import type { DeezerTrackPreview } from "@/types/api";
import { api, routes } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

const getTrackPreview = async (isrc: string): Promise<DeezerTrackPreview> =>
  api.get(routes.previews(isrc));

const useTrackPreview = (isrc: string | undefined) =>
  useQuery({
    queryKey: ["preview", isrc],
    queryFn: () => getTrackPreview(isrc!),
    enabled: !!isrc,
  });

export default useTrackPreview;
