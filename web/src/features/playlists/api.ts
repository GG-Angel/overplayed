import { get, routes } from "@/lib/api";
import type { SpotifyPlaylist, SpotifyPlaylistTracks } from "@/lib/spotify/types";

export const getPlaylist = async (id: string) =>
  await get<SpotifyPlaylist>(routes.playlists.one(id));

export const getPlaylists = async () => await get<SpotifyPlaylist[]>(routes.playlists.all());

export const getPlaylistTracks = async (id: string, offset: number, limit: number) =>
  await get<SpotifyPlaylistTracks>(routes.playlists.tracks(id, offset, limit));
