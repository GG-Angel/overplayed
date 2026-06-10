import api from "@/lib/api-client";
import { playlistMetadataSchema } from "@/lib/types";

export const createPlaylist = async () => {
  return playlistMetadataSchema.parse(await api.post("/playlists"));
};
