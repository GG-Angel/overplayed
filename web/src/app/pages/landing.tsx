import Button from "@/components/ui/Button";
import { useUserContext } from "@/context/UserContext";
import SpotifyIcon from "@/assets/spotify.svg?react";
import { useNavigate } from "react-router-dom";

export const LandingPage = () => {
  const { user, login } = useUserContext();
  const navigate = useNavigate();

  const handleViewPlaylists = () => {
    navigate("/playlists");
  };

  return (
    <>
      {user ? (
        <Button variant="outline" onClick={handleViewPlaylists}>
          View your playlists
        </Button>
      ) : (
        <Button icon={<SpotifyIcon className="size-5" />} onClick={login}>
          Log in with Spotify
        </Button>
      )}
    </>
  );
};
