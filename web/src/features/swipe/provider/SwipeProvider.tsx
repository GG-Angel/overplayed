import { useMemo, useState } from "react";
import type { SwipeSubmissionForm, Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylist } from "@/features/playlist/api/get-playlist";
import LoadingState from "@/components/states/LoadingState";
import { usePlaylistTracks } from "@/features/playlist/api/get-playlist-tracks";

const SwipeProvider = () => {
  const { playlistId } = useParams();
  if (!playlistId) return <ErrorState message="No Playlist Provided" />;
  return <SwipeProviderInner playlistId={playlistId} />;
};

const initialOptions: SwipeSubmissionForm["options"] = {
  backup_enabled: true,
  remove_from_likes: false,
};

const SwipeProviderInner = ({ playlistId }: { playlistId: string }) => {
  const [options, setOptions] = useState<SwipeSubmissionForm["options"]>(initialOptions);
  const session = useSwipes<Track>();
  const playlist = usePlaylist(playlistId);
  const tracks = usePlaylistTracks(playlistId, session.swipes.length);

  const contextValue = useMemo(() => {
    if (!playlist.isSuccess || !tracks.isSuccess) return null;
    return {
      session,
      options,
      setOptions,
      playlist: {
        metadata: playlist.data,
        tracks: tracks.data.pages.flatMap((p) => p.tracks),
      },
    };
  }, [session, options, playlist.isSuccess, playlist.data, tracks.isSuccess, tracks.data]);

  if (playlist.isError || tracks.isError) {
    return <ErrorState message="Failed to Load Playlist" />;
  }

  if (!playlist.isSuccess || !tracks.isSuccess) {
    return <LoadingState message={`Loading ${!playlist.isSuccess ? "playlist" : "tracks"}...`} />;
  }

  return (
    <SwipeContext.Provider value={contextValue}>
      <Outlet />
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
