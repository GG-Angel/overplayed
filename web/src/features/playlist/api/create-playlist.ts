import api from "@/lib/api-client";
import { queryKeys } from "@/lib/query";
import { playlistMetadataSchema } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const createPlaylist = async () => {
  return playlistMetadataSchema.parse(await api.post("/playlists"));
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPlaylist,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all, exact: true });
    },
  });

  return mutation;
};
