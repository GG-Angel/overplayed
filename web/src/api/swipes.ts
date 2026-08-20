import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import {
  swipeSubmissionResponseSchema,
  trackPreviewSchema,
  type SwipeSubmissionForm,
  type SwipeSubmissionResponse,
  type TrackPreview,
} from "../types";
import api, { queryKeys } from "./client";

export const submitSwipes = async (
  playlistId: string,
  form: SwipeSubmissionForm
): Promise<SwipeSubmissionResponse> =>
  swipeSubmissionResponseSchema.parse(
    await api.post(`/playlists/${playlistId}/swipes`, form)
  );

const getTrackPreviewUrl = async (isrc: string): Promise<TrackPreview> =>
  trackPreviewSchema.parse(await api.get(`/previews/${isrc}`));

const getTrackPreviewUrlQueryOptions = (isrc: string | undefined) =>
  queryOptions({
    queryKey: queryKeys.trackPreview(isrc!),
    queryFn: () => getTrackPreviewUrl(isrc!),
    staleTime: ({ state }) => (state.data?.expires_in ?? 60 * 60) * 1000,
    enabled: !!isrc,
  });

export const useTrackPreviewUrl = (isrc: string | undefined) =>
  useQuery(getTrackPreviewUrlQueryOptions(isrc));

export const useTrackPreviewUrls = (isrcs: (string | undefined)[]) =>
  useQueries({
    queries: isrcs.map((isrc) => getTrackPreviewUrlQueryOptions(isrc)),
  });
