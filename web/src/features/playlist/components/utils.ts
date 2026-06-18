import { LIKED_SONGS_ID, type Playlist } from "@/lib/types";
import { extractImageUrl } from "@/lib/utils";

export type PlaylistDisplayProps = {
  playlist: Playlist;
  onClick?: (playlistId: string) => void;
};

export const extractPlaylistCoverUrl = (playlist: Playlist) => {
  return playlist.id === LIKED_SONGS_ID
    ? "/liked-songs-cover.webp"
    : extractImageUrl(playlist.images ?? [], "lg");
};
