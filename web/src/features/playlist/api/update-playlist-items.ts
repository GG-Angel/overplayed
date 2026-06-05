import { buildURLWithParams } from "@/lib/api";
import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

export const useUpdatePlaylistItems = (
  playlistId: string,
  uris: string[],
  action: PlaylistItemsUpdateAction
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => updatePlaylistItems(playlistId, uris, action),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists.metadata(playlistId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists.tracks(playlistId) }),
      ]);
    },
  });
};
