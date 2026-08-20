/* eslint-disable react-refresh/only-export-components */
import { ArrowUpRight } from "lucide-react";
import type { Playlist } from "../types";
import { LIKED_SONGS_ID } from "../types";
import { extractImageUrl } from "../utils";
import Image from "./ui/Image";

export type PlaylistDisplayProps = {
  playlist: Playlist;
  onClick?: (playlistId: string) => void;
};

export const extractPlaylistCoverUrl = (playlist: Playlist) =>
  playlist.id === LIKED_SONGS_ID
    ? "/liked-songs-cover.webp"
    : extractImageUrl(playlist.images ?? [], "lg");

export const PlaylistCard = ({ playlist, onClick }: PlaylistDisplayProps) => {
  const coverUrl = extractPlaylistCoverUrl(playlist);
  return (
    <button
      onClick={() => onClick?.(playlist.id)}
      disabled={playlist.tracks.total <= 0}
      className="group relative flex snap-start h-32 w-full gap-4 overflow-hidden rounded-xl border-2 border-card-border bg-card px-4 py-3 text-left not-disabled:cursor-pointer disabled:opacity-50"
    >
      <Image
        src={coverUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover opacity-15 blur-lg"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-black/20 group-hover:to-black/40 transition-colors" />
      <Image
        src={coverUrl}
        alt={playlist.name}
        loading="lazy"
        className="z-10 aspect-square h-full rounded-sm object-cover transition-transform"
      />
      <div className="z-10 flex w-full flex-col justify-between overflow-hidden">
        <ArrowUpRight className="origin-top-right self-end transition group-hover:scale-125 group-hover:text-primary" />
        <div>
          <p className="truncate font-semibold">{playlist.name}</p>
          <p className="truncate text-muted">{playlist.tracks.total} tracks</p>
        </div>
      </div>
    </button>
  );
};

export const PlaylistCover = ({ playlist, onClick }: PlaylistDisplayProps) => (
  <button
    onClick={() => onClick?.(playlist.id)}
    disabled={playlist.tracks.total <= 0}
    className="relative group overflow-hidden cursor-pointer disabled:opacity-50 disabled:pointer-events-none w-full aspect-square snap-start *:rounded-2xl *:border-4 *:border-card-border"
  >
    <Image
      src={extractPlaylistCoverUrl(playlist)}
      className="size-full aspect-square object-cover"
      alt={`${playlist.name} cover`}
    />
    <div className="flex flex-col justify-center absolute inset-0 bg-linear-to-t from-background/95 to-background/85 opacity-0 group-hover:opacity-100 transition-opacity px-4 overflow-hidden">
      <h3 className="truncate">{playlist.name}</h3>
      <p className="text-muted text-sm truncate">{playlist.tracks.total} tracks</p>
    </div>
  </button>
);

export const PlaylistRow = ({ playlist, onClick }: PlaylistDisplayProps) => (
  <button
    onClick={() => onClick?.(playlist.id)}
    disabled={playlist.tracks.total <= 0}
    className="flex items-center justify-between shrink-0 snap-start group hover:bg-card px-1.5 py-1 gap-4 rounded-sm text-nowrap not-disabled:cursor-pointer disabled:opacity-50"
  >
    <span className="truncate font-semibold">{playlist.name}</span>
    <div className="flex items-center gap-4">
      <span className="text-muted">{playlist.tracks.total} tracks</span>
      <ArrowUpRight className="transition-colors text-accent" />
    </div>
  </button>
);
