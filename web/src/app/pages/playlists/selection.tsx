import PlaylistCard from "@/features/playlist/components/PlaylistCard";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/states/LoadingState";
import { usePlaylists } from "@/features/playlist/hooks/usePlaylists";

const SelectionPage = () => {
  const { data: playlists, isLoading } = usePlaylists();
  const navigate = useNavigate();

  const navigateToPlaylist = (playlistId: string) => {
    navigate(`${playlistId}/swipe`);
  };

  if (isLoading) return <LoadingState message="Loading playlists..." />;

  return (
    <>
      <p className="text-4xl text-center font-medium mb-4">Select a Playlist</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 pb-4">
        {playlists &&
          playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} onClick={navigateToPlaylist} />
          ))}
      </div>
    </>
  );
};

export default SelectionPage;
