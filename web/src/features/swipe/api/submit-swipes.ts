import api from "@/lib/api-client";
import { swipesResponseSchema, type SwipesForm, type SwipesResponse } from "@/lib/types";

export const submitSwipes = async (
  playlistId: string,
  form: SwipesForm
): Promise<SwipesResponse> => {
  return swipesResponseSchema.parse(await api.post(`/playlists/${playlistId}/swipes`, form));
};
