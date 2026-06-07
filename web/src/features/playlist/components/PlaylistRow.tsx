import { ArrowUpRight } from "lucide-react";
import type { PlaylistDisplayProps } from "./props";

const PlaylistRow = ({ playlist, onClick }: PlaylistDisplayProps) => {
  return (
    <button
      onClick={() => onClick?.(playlist.id)}
      disabled={playlist.tracks.total <= 0}
      className="flex items-center justify-between group hover:bg-card px-1.5 py-1 gap-4 rounded-sm text-nowrap not-disabled:cursor-pointer disabled:opacity-50"
    >
      <span className="truncate font-semibold">{playlist.name}</span>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">{playlist.tracks.total} tracks</span>
        <ArrowUpRight className="transition-colors text-accent" />
      </div>
    </button>
  );
};

export default PlaylistRow;
