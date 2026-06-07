import { extractImageUrl } from "@/lib/utils";
import type { PlaylistDisplayProps } from "./props";

const PlaylistCover = ({ playlist, onClick }: PlaylistDisplayProps) => {
  const coverUrl = extractImageUrl(playlist.images ?? [], "lg");

  return (
    <button
      onClick={() => onClick?.(playlist.id)}
      disabled={playlist.tracks.total <= 0}
      className="relative group rounded-2xl overflow-hidden border-4 border-card-border not-disabled:cursor-pointer disabled:opacity-50"
    >
      <img src={coverUrl} className="w-full aspect-square object-cover" />
      <div className="flex flex-col justify-center absolute inset-0 bg-linear-to-t from-background to-background/85 opacity-0 group-hover:opacity-100 transition-opacity px-4">
        <h3 className="truncate">{playlist.name}</h3>
        <p className="text-muted-foreground text-sm">{playlist.tracks.total} tracks</p>
      </div>
    </button>
  );
};

export default PlaylistCover;
