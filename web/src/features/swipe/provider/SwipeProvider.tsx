import { useMemo, useState } from "react";
import type { SwipesFormOptions, Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylistMetadata } from "@/features/playlist/api/get-playlist-metadata";
import LoadingState from "@/components/states/LoadingState";
import { usePrefetchedPlaylistItems } from "@/features/playlist/api/get-playlist-items";

const SwipeProvider = () => {
  const { playlistId } = useParams();
  if (!playlistId) return <ErrorState message="No Playlist Provided" />;
  return <SwipeProviderInner playlistId={playlistId} />;
};

const initialOptions: SwipesFormOptions = { backup_enabled: true };

const SwipeProviderInner = ({ playlistId }: { playlistId: string }) => {
  const [options, setOptions] = useState<SwipesFormOptions>(initialOptions);
  const session = useSwipes<Track>();

  const playlist = usePlaylistMetadata(playlistId);
  const playlistItems = usePrefetchedPlaylistItems(playlistId, session.swipes.length);
  const playlistTracks = useMemo(
    () => playlistItems.data?.pages.flatMap((p) => p.items.map((i) => i.track)) ?? [],
    [playlistItems.data?.pages]
  );

  const contextValue = useMemo(() => {
    if (!playlist.isSuccess || !playlistItems.isSuccess) return null;
    return {
      session,
      options,
      setOptions,
      playlist: {
        pagination: playlistItems.data.pages[0].metadata,
        metadata: playlist.data,
        tracks: playlistTracks,
      },
    };
  }, [
    session,
    options,
    playlist.isSuccess,
    playlist.data,
    playlistItems.isSuccess,
    playlistItems.data,
    playlistTracks,
  ]);

  if (playlist.isError || playlistItems.isError)
    return <ErrorState message="Failed to Load Playlist" />;

  if (!playlist.isSuccess || !playlistItems.isSuccess)
    return <LoadingState message={`Loading ${!playlist.isSuccess ? "playlist" : "tracks"}...`} />;

  return (
    <SwipeContext.Provider value={contextValue}>
      <Outlet />
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
