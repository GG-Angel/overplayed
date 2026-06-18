import type { Playlist } from "@/lib/types";

export type PlaylistDisplayProps = {
  playlist: Playlist;
  onClick?: (playlistId: string) => void;
};
