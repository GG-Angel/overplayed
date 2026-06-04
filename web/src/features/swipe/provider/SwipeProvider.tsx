import { useState } from "react";
import type { Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext, type SwipeFormOptions } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylistMetadata } from "@/features/playlist/api/get-playlist-metadata";
import { useInfinitePlaylistItems } from "@/features/playlist/api/get-playlist-items";
import LoadingState from "@/components/states/LoadingState";

type SwipeProviderInnerProps = {
  playlistId: string;
};

const SwipeProviderInner = ({ playlistId }: SwipeProviderInnerProps) => {
  const session = useSwipes<Track>();
  const [options, setOptions] = useState<SwipeFormOptions>({ backupEnabled: true });

  const playlist = usePlaylistMetadata(playlistId);
  const items = useInfinitePlaylistItems(playlistId);

  if (playlist.isError || items.isError) return <ErrorState message="Failed to load playlist" />;

  if (!playlist.isSuccess) return <LoadingState message="Loading playlist..." />;
  if (!items.isSuccess) return <LoadingState message="Loading tracks..." />;

  // TODO: see later if we need this
  // if (items.data.pages[0].total === 0 && session.swipes.length === 0)
  //   return <ErrorState message="Playlist is empty" />;

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

const SwipeProvider = () => {
  const { playlistId } = useParams();
  if (!playlistId) return <ErrorState message="No playlist provided" />;
  return <SwipeProviderInner playlistId={playlistId} />;
};

export default SwipeProvider;
