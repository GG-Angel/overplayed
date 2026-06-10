import { buildURLWithParams } from "@/lib/api";
import api from "@/lib/api-client";

type PlaylistItemsUpdateAction = "add" | "remove";

export const updatePlaylistItems = async (
  playlistId: string,
  uris: string[],
  action: PlaylistItemsUpdateAction
) => {
  await api.post(
    buildURLWithParams(`/playlists/${playlistId}/items`, {
      action,
    }),
    { uris }
  );
};
