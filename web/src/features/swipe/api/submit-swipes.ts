import api from "@/lib/api-client";
import {
  swipeSubmissionResponseSchema,
  type SwipeSubmissionForm,
  type SwipeSubmissionResponse,
} from "@/lib/types";

export const submitSwipes = async (
  playlistId: string,
  form: SwipeSubmissionForm
): Promise<SwipeSubmissionResponse> => {
  return swipeSubmissionResponseSchema.parse(
    await api.post(`/playlists/${playlistId}/swipes`, form)
  );
};
