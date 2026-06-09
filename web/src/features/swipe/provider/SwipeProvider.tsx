import { useMemo, useState } from "react";
import type { Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext, type SwipeContextValues, type SwipeFormOptions } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylistMetadata } from "@/features/playlist/api/get-playlist-metadata";
import LoadingState from "@/components/states/LoadingState";
import { usePrefetchedPlaylistItems } from "@/features/playlist/api/get-playlist-items";
import useTimer from "@/hooks/useTimer";

const initialOptions: SwipeFormOptions = { backupEnabled: true };

const SwipeProvider = () => {
  const { playlistId } = useParams();
  if (!playlistId) return <ErrorState message="No playlist provided" />;
  return <SwipeProviderInner playlistId={playlistId} />;
};

const SwipeProviderInner = ({ playlistId }: { playlistId: string }) => {
  const [options, setOptions] = useState<SwipeFormOptions>(initialOptions);
  const session = useSwipes<Track>();
  const timer = useTimer();

  const playlist = usePlaylistMetadata(playlistId);
  const playlistItems = usePrefetchedPlaylistItems(playlistId, session.swipes.length);
  const playlistTracks = useMemo(
    () => playlistItems.data?.pages.flatMap((p) => p.items.map((i) => i.track)) ?? [],
    [playlistItems.data?.pages]
  );

  const contextValue = useMemo(
    () =>
      playlist.isSuccess && playlistItems.isSuccess
        ? ({
            session,
            options,
            setOptions,
            timer,
            playlist: {
              metadata: playlist.data,
              tracks: playlistTracks,
              totalTracks: playlistItems.data.pages[0].total,
            },
          } satisfies SwipeContextValues)
        : null,
    [
      session,
      options,
      timer,
      playlist.isSuccess,
      playlist.data,
      playlistItems.isSuccess,
      playlistItems.data,
      playlistTracks,
    ]
  );

  if (playlist.isError || playlistItems.isError)
    return <ErrorState message="Failed to load playlist" />;

  if (!playlist.isSuccess || !playlistItems.isSuccess)
    return <LoadingState message={`Loading ${!playlist.isSuccess ? "playlist" : "tracks"}...`} />;

  return (
    <SwipeContext.Provider value={contextValue}>
      <Outlet />
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
