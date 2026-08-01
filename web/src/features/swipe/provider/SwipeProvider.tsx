import { useMemo, useState } from "react";
import type { Playlist, SwipeSubmissionForm, Track } from "@/lib/types";
import useSwipes, { type Swipe } from "../hooks/useSwipes";
import { SwipeContext } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylist } from "@/features/playlist/api/get-playlist";
import LoadingState from "@/components/states/LoadingState";
import { usePlaylistTracks } from "@/features/playlist/api/get-playlist-tracks";
import useTrackOrder from "../hooks/useTrackOrder";
import useNavBlocker from "@/hooks/useNavBlocker";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Play, Undo2 } from "lucide-react";
import { loadFromStorage } from "@/lib/utils";
import { storageKeys } from "@/hooks/useLocalStorage";

const initialOptions: SwipeSubmissionForm["options"] = {
  backup_enabled: true,
  remove_from_likes: false,
};

const SwipeProvider = () => {
  const { playlistId } = useParams();
  const playlist = usePlaylist(playlistId);

  if (!playlistId) return <ErrorState message="No Playlist Provided" />;

  if (playlist.isError) {
    return <ErrorState message="Failed to Load Playlist" />;
  }

  if (!playlist.isSuccess) {
    return <LoadingState message="Loading Playlist..." />;
  }

  return <SwipeProviderInner playlist={playlist.data} />;
};

const SwipeProviderInner = ({ playlist }: { playlist: Playlist }) => {
  const [options, setOptions] = useState<SwipeSubmissionForm["options"]>(initialOptions);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const savedSwipes = loadFromStorage<Swipe<Track>[]>(
    sessionStorage,
    storageKeys.swipes(playlist.id, playlist.snapshot_id),
    []
  );
  const session = useSwipes<Track>(savedSwipes);
  const tracks = usePlaylistTracks(playlist.id, session.swipes.length);
  const leaveBlocker = useNavBlocker(
    session.dislikes.length > 0 && !hasSubmitted,
    `/playlists/${playlist.id}/swipe`
  );

  const loadedTracks = useMemo(
    () => tracks.data?.pages.flatMap((p) => p.tracks) ?? [],
    [tracks.data]
  );

  const order = useTrackOrder(loadedTracks, session.swipes.length);

  const contextValue = useMemo(() => {
    if (!tracks.isSuccess) return null;
    return {
      session,
      options,
      setOptions,
      hasSubmitted,
      setHasSubmitted,
      shuffle: order.shuffle,
      playlist: {
        metadata: playlist,
        tracks: order.tracks,
      },
    };
  }, [tracks.isSuccess, session, options, hasSubmitted, order.shuffle, order.tracks, playlist]);

  if (tracks.isError) {
    return <ErrorState message="Failed to Load Tracks" />;
  }

  if (!tracks.isSuccess) {
    return <LoadingState message="Loading tracks..." />;
  }

  return (
    <SwipeContext.Provider value={contextValue}>
      <Outlet />
      {leaveBlocker.state === "blocked" && (
        <Modal onClose={() => leaveBlocker.reset()} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2>Leave without saving?</h2>
            <p className="text-muted">
              Your swipes haven't been submitted yet. If you leave now, your progress will be lost.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:w-1/2 lg:self-end gap-2">
            <Button
              icon={<Undo2 className="size-4" />}
              variant="secondary"
              onClick={() => leaveBlocker.proceed()}
            >
              Leave
            </Button>
            <Button
              icon={<Play className="size-4" />}
              variant="primary"
              onClick={() => leaveBlocker.reset()}
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
