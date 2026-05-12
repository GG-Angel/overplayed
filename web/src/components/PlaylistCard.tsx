import type { Playlist } from "@/lib/types";
import { ArrowUpRight } from "lucide-react";

type PlaylistCardProps = {
  playlist: Playlist;
  onClick?: (id: string) => void;
};

const PlaylistCard = ({ playlist, onClick }: PlaylistCardProps) => {
  const coverUrl = playlist.images?.at(-1)?.url;
  return (
    <button
      type="button"
      onClick={() => onClick?.(playlist.id)}
      className="group relative flex h-32 w-full gap-4 overflow-hidden rounded-xl border-2 border-sp-gray-light bg-sp-gray px-4 py-3 text-left hover:cursor-pointer"
    >
      {/* Blurred backdrop */}
      <img
        src={coverUrl}
        aria-hidden="true"
        draggable={false}
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-15 blur-lg"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-black/20 group-hover:to-black/40 transition-colors" />

      {/* Cover */}
      <img
        src={coverUrl}
        alt={`${playlist.name} cover`}
        loading="lazy"
        className="z-10 aspect-square h-full shrink-0 rounded-sm object-cover transition-transform"
      />

      {/* Text + icon */}
      <div className="z-10 flex w-full flex-col justify-between overflow-hidden">
        <ArrowUpRight className="origin-top-right self-end transition group-hover:scale-125 group-hover:text-accent" />
        <div>
          <p className="truncate font-semibold text-text-h">{playlist.name}</p>
          <p className="truncate text-muted">{playlist.tracks.total} tracks</p>
        </div>
      </div>
    </button>
  );
};

export default PlaylistCard;
