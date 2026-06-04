import { useState } from "react";
import type { Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext, type SwipeFormOptions } from "./SwipeContext";
import { Outlet, useParams } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import { usePlaylistMetadata } from "@/features/playlist/api/get-playlist-metadata";
import { useInfinitePlaylistItems } from "@/features/playlist/api/get-playlist-items";
import LoadingState from "@/components/states/LoadingState";

type SwipeProviderProps = {
  playlistId: string;
};

const SwipeProvider = () => {
  const { playlistId } = useParams();
  if (!playlistId) return <ErrorState message="No playlist provided" />;
  return <SwipeProviderInner playlistId={playlistId} />;
};

const SwipeProviderInner = ({ playlistId }: SwipeProviderProps) => {
  const session = useSwipes<Track>();
  const [options, setOptions] = useState<SwipeFormOptions>({ backupEnabled: true });

  const playlist = usePlaylistMetadata(playlistId);
  const items = useInfinitePlaylistItems(playlistId);

  if (playlist.isError || items.isError) return <ErrorState message="Failed to load playlist" />;
  if (!playlist.isSuccess || !items.isSuccess)
    return <LoadingState message="Loading playlist..." />;

  return (
    <SwipeContext.Provider
      value={{ session, options, setOptions, playlist: playlist.data, items: items.data.pages }}
    >
      <Outlet />
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
