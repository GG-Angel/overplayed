import { useMemo, useState } from "react";
import type { Playlist, SwipeSubmissionForm, Track } from "@/lib/types";
import useSwipes, { type Swipe } from "../hooks/useSwipes";
import { SwipeContext, type SwipeContextValues } from "./SwipeContext";
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
import useShuffle from "../hooks/useShuffle";

type SwipeProviderProps = {
  playlist: Playlist;
  tracks: Track[];
  hasLoadedAllTracks: boolean;
};

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

  if (tracks.data.length === 0) return <ErrorState message="This Playlist is Empty" />;

  return (
    <SwipeProviderInner
      playlist={playlist.data}
      tracks={tracks.data}
      hasLoadedAllTracks={!tracks.isFetching}
    />
  );
};

const SwipeProviderInner = ({ playlist, tracks, hasLoadedAllTracks }: SwipeProviderProps) => {
  const [options, setOptions] = useState<SwipeSubmissionForm["options"]>(initialOptions);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [persistedSwipes] = useState<Swipe<Track>[]>(
    loadFromStorage<Swipe<Track>[]>(
      sessionStorage,
      storageKeys.swipes(playlist.id, playlist.snapshot_id),
      []
    )
  );
  const session = useSwipes<Track>(persistedSwipes);
  const currentIndex = session.swipes.length;

  const orderedTracks = useMemo(() => {
    const persistedTracks = persistedSwipes.map((swipe) => swipe.item);
    const persistedTrackIds = new Set(persistedTracks.map((track) => track.id));
    return [...persistedTracks, ...tracks.filter((track) => !persistedTrackIds.has(track.id))];
  }, [persistedSwipes, tracks]);

  const { items: shuffledTracks, shuffle } = useShuffle<Track>(orderedTracks, currentIndex);

  const contextValue = useMemo(
    () =>
      ({
        session,
        options,
        setOptions,
        hasSubmitted,
        setHasSubmitted,
        shuffle,
        currentIndex,
        hasLoadedAllTracks,
        playlist,
        tracks: shuffledTracks,
      } satisfies SwipeContextValues),
    [
      session,
      options,
      hasSubmitted,
      shuffle,
      currentIndex,
      hasLoadedAllTracks,
      playlist,
      shuffledTracks,
    ]
  );

  const exitBlocker = useNavBlocker(
    session.dislikes.length > 0 && !hasSubmitted,
    `/playlists/${playlist.id}/swipe`
  );

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
