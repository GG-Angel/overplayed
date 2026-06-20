import { useMemo, useState } from "react";
import type { SwipeSubmissionForm, Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylist } from "@/features/playlist/api/get-playlist";
import LoadingState from "@/components/states/LoadingState";
import { usePlaylistTracks } from "@/features/playlist/api/get-playlist-tracks";
import useNavBlocker from "@/hooks/useNavBlocker";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

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

  const blocker = useNavBlocker(session.swipes.length > 0, `/playlists/${playlistId}/swipe`);

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
      {blocker.state === "blocked" && (
        <Modal title="Leave without saving?" onClose={() => blocker.reset()}>
          <p className="text-muted">
            Your swipes haven't been submitted yet. If you leave now, your progress will be lost.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => blocker.reset()}>
              Stay
            </Button>
            <Button variant="primary" onClick={() => blocker.proceed()}>
              Leave
            </Button>
          </div>
        </Modal>
      )}
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
