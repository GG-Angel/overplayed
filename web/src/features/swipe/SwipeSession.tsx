/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Outlet, useParams } from "react-router-dom";
import { Play, Undo2 } from "lucide-react";
import { usePlaylist, usePlaylistTracks } from "../../api/playlists";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { ErrorState, LoadingState } from "../../components/PageState";
import { useNavBlocker } from "../../hooks";
import { loadFromStorage, storageKeys } from "../../storage";
import type { Playlist, SwipeSubmissionForm, Track } from "../../types";
import { shuffleArray } from "../../utils";

export type SwipeDecision = "like" | "dislike";
export type Swipe<T> = { item: T; decision: SwipeDecision };

const useSwipes = <T,>(initialSwipes: Swipe<T>[] = []) => {
  const [swipes, setSwipes] = useState<Swipe<T>[]>(initialSwipes);
  const { likes, dislikes } = useMemo(() => {
    const likes: T[] = [];
    const dislikes: T[] = [];
    for (const swipe of swipes) {
      (swipe.decision === "like" ? likes : dislikes).push(swipe.item);
    }
    return { likes, dislikes };
  }, [swipes]);
  const recordSwipe = useCallback(
    (swipe: Swipe<T>) => setSwipes((previous) => [...previous, swipe]),
    []
  );
  const recordSwipes = useCallback(
    (nextSwipes: Swipe<T>[]) => setSwipes((previous) => [...previous, ...nextSwipes]),
    []
  );
  const undoSwipe = useCallback(() => setSwipes((previous) => previous.slice(0, -1)), []);
  return { swipes, likes, dislikes, recordSwipe, recordSwipes, undoSwipe };
};

const useShuffle = <T,>(items: T[], consumed: number) => {
  const [order, setOrder] = useState<number[]>([]);
  const shuffle = useCallback(() => {
    setOrder((previous) => {
      const full = [
        ...previous,
        ...items.slice(previous.length).map((_, index) => previous.length + index),
      ];
      return [...full.slice(0, consumed), ...shuffleArray(full.slice(consumed))];
    });
  }, [consumed, items]);
  const shuffledItems = useMemo(
    () => [...order.map((index) => items[index]), ...items.slice(order.length)],
    [order, items]
  );
  return { items: shuffledItems, shuffle };
};

type SwipeContextValues = {
  session: ReturnType<typeof useSwipes<Track>>;
  options: SwipeSubmissionForm["options"];
  setOptions: Dispatch<SetStateAction<SwipeSubmissionForm["options"]>>;
  hasSubmitted: boolean;
  setHasSubmitted: Dispatch<SetStateAction<boolean>>;
  hasLoadedAllTracks: boolean;
  currentIndex: number;
  shuffle: () => void;
  playlist: Playlist;
  tracks: Track[];
  tracksLoaded: number;
};

const SwipeContext = createContext<SwipeContextValues | null>(null);

export const useSwipeSession = (): SwipeContextValues => {
  const context = useContext(SwipeContext);
  if (!context) throw new Error("useSwipeSession must be used inside a SwipeSession");
  return context;
};

const initialOptions: SwipeSubmissionForm["options"] = {
  backup_enabled: true,
  remove_from_likes: false,
};

const SwipeSessionInner = ({
  playlist,
  tracks,
  hasLoadedAllTracks,
}: {
  playlist: Playlist;
  tracks: Track[];
  hasLoadedAllTracks: boolean;
}) => {
  const [options, setOptions] = useState<SwipeSubmissionForm["options"]>(initialOptions);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [persistedSwipes] = useState<Swipe<Track>[]>(() =>
    loadFromStorage(
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
  const { items: shuffledTracks, shuffle } = useShuffle(orderedTracks, currentIndex);
  const contextValue = useMemo(
    () => ({
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
      tracksLoaded: tracks.length,
    }),
    [
      session,
      options,
      hasSubmitted,
      shuffle,
      currentIndex,
      hasLoadedAllTracks,
      playlist,
      shuffledTracks,
      tracks.length,
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

const SwipeSession = () => {
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
    <SwipeSessionInner
      playlist={playlist.data}
      tracks={tracks.data}
      hasLoadedAllTracks={!tracks.isFetching}
    />
  );
};

export default SwipeSession;
