import { useState } from "react";
import type { Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext, type SwipeFormOptions } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylistMetadata } from "@/features/playlist/api/get-playlist-metadata";
import LoadingState from "@/components/states/LoadingState";
import { usePrefetchedPlaylistItems } from "@/features/playlist/api/get-playlist-items";

const initialOptions: SwipeFormOptions = { backupEnabled: true };

const SwipeProvider = () => {
  const { playlistId } = useParams();
  if (!playlistId) return <ErrorState message="No playlist provided" />;
  return <SwipeProviderInner playlistId={playlistId} />;
};

const SwipeProviderInner = ({ playlistId }: { playlistId: string }) => {
  const session = useSwipes<Track>();
  const [options, setOptions] = useState<SwipeFormOptions>(initialOptions);

  const playlist = usePlaylistMetadata(playlistId);
  const items = usePrefetchedPlaylistItems(playlistId, session.swipes.length);

  if (playlist.isError || items.isError) return <ErrorState message="Failed to load playlist" />;
  if (!playlist.isSuccess || !items.isSuccess)
    return <LoadingState message={`Loading ${!playlist.isSuccess ? "playlist" : "tracks"}...`} />;

  return (
    <SwipeContext.Provider
      value={{
        session,
        options,
        setOptions,
        playlist: {
          metadata: playlist.data,
          tracks: items.data.pages.flatMap((p) => p.items.map((i) => i.track)),
          totalTracks: items.data.pages[0].total,
        },
      }}
    >
      <Outlet />
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
