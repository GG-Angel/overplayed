import { SkipForward } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AvatarControl from "./AvatarControl";
import { usePlaylist } from "@/hooks/playlists";

const Logo = () => {
  const { playlistId } = useParams();
  const { data: playlist } = usePlaylist(playlistId);

  return (
    <Link to="/" className="inline-flex items-center gap-1.5 select-none overflow-hidden">
      <SkipForward className="text-primary" />
      <span className="text-lg font-semibold hidden sm:block">Overplayed</span>
      {playlist && (
        <span className="text-muted-foreground truncate max-w-sm">/ {playlist.name}</span>
      )}
    </Link>
  );
};

const Navbar = () => {
  return (
    <div className="flex justify-between items-center py-2 gap-4">
      <Logo />
      <AvatarControl />
    </div>
  );
};

export default Navbar;
