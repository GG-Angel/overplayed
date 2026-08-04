import { useMemo, useState } from "react";
import type { Playlist, SwipeSubmissionForm, Track } from "@/lib/types";
import useSwipes, { type Swipe } from "../hooks/useSwipes";
import { SwipeContext } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylist } from "@/features/playlist/api/get-playlist";
import LoadingState from "@/components/states/LoadingState";
import { usePlaylistTracks } from "@/features/playlist/api/get-playlist-tracks";
import useNavBlocker from "@/hooks/useNavBlocker";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Play, Undo2 } from "lucide-react";
import { loadFromStorage, storageKeys } from "@/lib/storage";

const initialOptions: SwipeSubmissionForm["options"] = {
  backup_enabled: true,
  remove_from_likes: false,
};

const SwipeProvider = () => {
  const { playlistId } = useParams();
  const playlist = usePlaylist(playlistId);
  const tracks = usePlaylistTracks(playlistId);

  if (!playlistId) return <ErrorState message="No Playlist Provided" />;

  if (playlist.isError) return <ErrorState message="Failed to Load Playlist" />;
  if (tracks.isError) return <ErrorState message="Failed to Load Tracks" />;

  if (!playlist.isSuccess) return <LoadingState message="Loading Playlist..." />;
  if (!tracks.isSuccess) return <LoadingState message="Loading tracks..." />;

  return <SwipeProviderInner playlist={playlist.data} tracks={tracks.data} />;
};

const SwipeProviderInner = ({ playlist, tracks }: { playlist: Playlist; tracks: Track[] }) => {
  const [options, setOptions] = useState<SwipeSubmissionForm["options"]>(initialOptions);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const persistedSwipes = loadFromStorage<Swipe<Track>[]>(
    sessionStorage,
    storageKeys.swipes(playlist.id, playlist.snapshot_id),
    []
  );
  const session = useSwipes<Track>(persistedSwipes);
  const exitBlocker = useNavBlocker(
    session.dislikes.length > 0 && !hasSubmitted,
    `/playlists/${playlist.id}/swipe`
  );

  const decided = useMemo(
    () => new Set(session.swipes.map((swipe) => swipe.item.uri)),
    [session.swipes]
  );

  const upcoming = tracks.filter((track) => !decided.has(track.uri));

  const contextValue = useMemo(() => {
    return {
      session,
      options,
      setOptions,
      hasSubmitted,
      setHasSubmitted,
      playlist,
      tracks: upcoming,
    };
  }, [hasSubmitted, options, playlist, session, upcoming]);

  return (
    <SwipeContext.Provider value={contextValue}>
      <Outlet />
      {exitBlocker.state === "blocked" && (
        <Modal onClose={() => exitBlocker.reset()} className="flex flex-col gap-6 max-w-2xl">
          <div className="flex flex-col gap-2">
            <h2>Leave without submitting?</h2>
            <p className="text-muted">
              Your swipes haven't been submitted yet. If your playlist changes before you return,
              you'll lose your progress.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:w-1/2 lg:self-end gap-2">
            <Button
              icon={<Undo2 className="size-4" />}
              variant="secondary"
              onClick={() => exitBlocker.proceed()}
            >
              Leave
            </Button>
            <Button
              icon={<Play className="size-4" />}
              variant="primary"
              onClick={() => exitBlocker.reset()}
            >
              Stay
            </Button>
          </div>
        </Modal>
      )}
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
