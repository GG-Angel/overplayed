import { SkipForward } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { extractImageUrl } from "@/lib/utils";
import { usePlaylistMetadata } from "@/features/playlist/api/get-playlist-metadata";

const LogoPlaylistCrumb = ({ playlistId }: { playlistId: string }) => {
  const { data: playlist } = usePlaylistMetadata(playlistId);

  if (!playlist) return null;

  const coverUrl = extractImageUrl(playlist.images ?? [], "sm");

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground min-w-0">
      <span>/</span>
      <img src={coverUrl} className="size-5 rounded shrink-0" />
      <span className="truncate">{playlist.name}</span>
    </span>
  );
};

const Logo = () => {
  const { playlistId } = useParams();

  return (
    <Link to="/" className="inline-flex items-center gap-1.5 select-none overflow-hidden">
      <SkipForward className="text-primary shrink-0" />
      <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
      {playlistId && <LogoPlaylistCrumb playlistId={playlistId} />}
    </Link>
  );
};

export default Logo;
