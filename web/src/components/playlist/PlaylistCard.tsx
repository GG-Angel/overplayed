import { ArrowUpRight } from "lucide-react";
import Image from "@/components/ui/Image";
import { extractPlaylistCoverUrl, type PlaylistDisplayProps } from "@/components/playlist/cover";

const PlaylistCard = ({ playlist, onClick }: PlaylistDisplayProps) => {
  const coverUrl = extractPlaylistCoverUrl(playlist);

  return (
    <button
      type="button"
      onClick={() => onClick?.(playlist.id)}
      disabled={playlist.tracks.total <= 0}
      className="group relative flex snap-start h-32 w-full gap-4 overflow-hidden rounded-xl border-2 border-card-border bg-card px-4 py-3 text-left not-disabled:cursor-pointer disabled:opacity-50"
    >
      {/* Blurred backdrop */}
      <Image
        src={coverUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover opacity-15 blur-lg"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-black/20 group-hover:to-black/40 transition-colors" />

      {/* Cover */}
      <Image
        src={coverUrl}
        alt={playlist.name}
        loading="lazy"
        className="z-10 aspect-square h-full rounded-sm object-cover transition-transform"
      />

      {/* Text + icon */}
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

export default PlaylistCard;
