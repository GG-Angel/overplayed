import type { PlaylistMetadata } from "@/lib/types";

export type PlaylistDisplayProps = {
  playlist: PlaylistMetadata;
  onClick?: (playlistId: string) => void;
};
