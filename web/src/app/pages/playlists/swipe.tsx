import { useParams } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { useEffect, useState } from "react";
import type { SpotifyPlaylistTrack } from "@/types/api";
import { api, routes } from "@/lib/api-client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const getPlaylistTracks = async (id: string, offset: number): Promise<SpotifyPlaylistTrack[]> =>
  api.get(routes.playlists.tracks(id, offset));

const PlaylistSwipePage = () => {
  const { id } = useParams();
  const [offset, setOffset] = useState(0);

  const { data: tracks } = useQuery({
    queryKey: ["playlists", id, "tracks", offset],
    queryFn: () => getPlaylistTracks(id!, offset),
    placeholderData: keepPreviousData,
    enabled: !!id,
  });

  useEffect(() => {});

  // need to store tracks as a list
  // prefetch next page when list gets small

  return <div>{tracks && <TrackCard track={tracks[0]} />}</div>;
};

export default PlaylistSwipePage;
