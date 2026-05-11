import PlaylistCard from "@/components/PlaylistCard";
import { useNavigate } from "react-router-dom";
import { LoadingPage } from "../loading";
import { usePlaylists } from "@/hooks/usePlaylists";

const PlaylistSelectionPage = () => {
  const { data: playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const navigate = useNavigate();

  const navigateToPlaylist = (id: string) => {
    navigate(`/playlists/${id}`);
  };

  if (isLoadingPlaylists) {
    return <LoadingPage />;
  }

  return (
    <>
      <p className="text-4xl text-center font-medium mb-4">Select a Playlist</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
        {playlists &&
          playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} onClick={navigateToPlaylist} />
          ))}
      </div>
    </>
  );
};

export default PlaylistSelectionPage;
