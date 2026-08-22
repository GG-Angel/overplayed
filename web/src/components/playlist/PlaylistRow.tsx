import { ArrowUpRight } from "lucide-react";
import type { PlaylistDisplayProps } from "./cover";

const PlaylistRow = ({ playlist, onClick }: PlaylistDisplayProps) => {
  return (
    <button
      type="button"
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
};

export default PlaylistRow;
