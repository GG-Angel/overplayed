import Image from "@/components/ui/Image";
import { extractPlaylistCoverUrl, type PlaylistDisplayProps } from "./cover";

const PlaylistCover = ({ playlist, onClick }: PlaylistDisplayProps) => {
  const coverUrl = extractPlaylistCoverUrl(playlist);

  return (
    <button
      onClick={() => onClick?.(playlist.id)}
      disabled={playlist.tracks.total <= 0}
      className="relative group overflow-hidden cursor-pointer disabled:opacity-50 disabled:pointer-events-none w-full aspect-square snap-start *:rounded-2xl *:border-4 *:border-card-border"
    >
      <Image
        src={coverUrl}
        className="size-full aspect-square object-cover"
        alt={`${playlist.name} cover`}
      />
      <div className="flex flex-col justify-center absolute inset-0 bg-linear-to-t from-background/95 to-background/85 opacity-0 group-hover:opacity-100 transition-opacity px-4 overflow-hidden">
        <h3 className="truncate">{playlist.name}</h3>
        <p className="text-muted text-sm truncate">{playlist.tracks.total} tracks</p>
      </div>
    </button>
  );
};

export default PlaylistCover;
