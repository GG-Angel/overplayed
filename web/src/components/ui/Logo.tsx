import { SkipForward } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { usePlaylist } from "@/features/playlist/api/get-playlist";
import { extractPlaylistCoverUrl } from "@/features/playlist/components/utils";

const LogoPlaylistCrumb = ({ playlistId }: { playlistId: string }) => {
  const { data: playlist } = usePlaylist(playlistId);

  if (!playlist) return null;

  const coverUrl = extractPlaylistCoverUrl(playlist);

  return (
    <span className="inline-flex items-center gap-1.5 text-muted min-w-0">
      <span>/</span>
      <img alt={`${playlist.name} cover`} src={coverUrl} className="size-5 rounded shrink-0" />
      <span className="truncate">{playlist.name}</span>
    </span>
  );
};

const Logo = () => {
  const { playlistId } = useParams();

  return (
    <Link
      to="/"
      aria-label="Overplayed - Navigate Home"
      className="inline-flex items-center gap-1.5 h-9 select-none overflow-hidden"
    >
      <SkipForward className="text-primary shrink-0" />
      <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
      {playlistId && <LogoPlaylistCrumb playlistId={playlistId} />}
    </Link>
  );
};

export default Logo;
