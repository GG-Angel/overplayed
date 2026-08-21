import { LIKED_SONGS_PLAYLIST_ID } from "@/lib/constants";
import { extractImageUrl } from "@/lib/utils";
import type { Playlist } from "@/types/spotify";

export type PlaylistDisplayProps = {
  playlist: Playlist;
  onClick?: (playlistId: string) => void;
};

export const extractPlaylistCoverUrl = (playlist: Playlist) => {
  return playlist.id === LIKED_SONGS_PLAYLIST_ID
    ? "/liked-songs-cover.webp"
    : extractImageUrl(playlist.images ?? [], "lg");
};
