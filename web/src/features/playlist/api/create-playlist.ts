import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { playlistMetadataSchema } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const createPlaylist = async () => {
  return playlistMetadataSchema.parse(await api.post("/playlists"));
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlaylist,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all, exact: true });
    },
  });
};
