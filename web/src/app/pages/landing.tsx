import Button from "@/components/ui/Button";
import SpotifyIcon from "@/assets/spotify.svg?react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { useAuth } from "@/hooks/useAuth";

export const LandingPage = () => {
  const { user, isLoading, redirectToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) return <LoadingState />;

  return (
    <>
      {user ? (
        <Button variant="secondary" onClick={() => navigate("/playlists")}>
          View your playlists
        </Button>
      ) : (
        <Button
          icon={<SpotifyIcon className="size-5" />}
          onClick={() => redirectToLogin(location.pathname)}
        >
          Log in with Spotify
        </Button>
      )}
    </>
  );
};
