import { useParams } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { useEffect, useState } from "react";
import type { SpotifyPlaylistTracks } from "@/types/api";
import { api, routes } from "@/lib/api-client";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingPage } from "../loading";
import Button from "@/components/ui/Button";

const getPlaylistTracks = async (id: string, offset: number): Promise<SpotifyPlaylistTracks> =>
  api.get(routes.playlists.tracks(id, offset));

const PlaylistSwipePage = () => {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [offset, setOffset] = useState(0);

  const { data, isPlaceholderData } = useQuery({
    queryKey: ["playlists", id, "tracks", offset],
    queryFn: () => getPlaylistTracks(id!, offset),
    placeholderData: keepPreviousData,
    enabled: !!id,
  });

  // prefetch the next page
  useEffect(() => {
    if (!isPlaceholderData && data?.has_more) {
      queryClient.prefetchQuery({
        queryKey: ["playlists", id, "tracks", offset + 100],
        queryFn: () => getPlaylistTracks(id!, offset + 100),
      });
    }
  }, [data, isPlaceholderData, offset, id, queryClient]);

  if (!data) {
    return <LoadingPage />;
  }

  return (
    <div>
      {data.tracks.map((t) => (
        <TrackCard key={t.track.id} track={t} />
      ))}
      <Button onClick={() => setOffset((prev) => prev + 100)}>Click me! Offset={offset}</Button>
    </div>
  );
};

export default PlaylistSwipePage;
