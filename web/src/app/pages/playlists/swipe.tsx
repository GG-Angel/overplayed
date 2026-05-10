import { usePlaylist, usePlaylistTracks } from "@/hooks/playlists";
import { useParams } from "react-router-dom";
import { ErrorPage } from "../error";
import { LoadingPage } from "../loading";

const PlaylistSwipePage = () => {
  const { id } = useParams();
  const {
    data: playlist,
    isError: isPlaylistError,
    isLoading: isLoadingPlaylist,
  } = usePlaylist(id);
  const {
    data: tracks,
    isError: isTracksError,
    isLoading: isLoadingTracks,
  } = usePlaylistTracks(id);

  if (isLoadingPlaylist || isLoadingTracks) {
    return <LoadingPage />;
  }

  if (isPlaylistError || isTracksError) {
    return <ErrorPage />;
  }

  return (
    <div>
      Swipe {playlist?.id} {tracks?.length}
    </div>
  );
};

export default PlaylistSwipePage;
