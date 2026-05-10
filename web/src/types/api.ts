export type SpotifyExternalUrls = {
  spotify: string;
};

export type SpotifyExternalIds = {
  isrc: string;
};

export type SpotifyId = {
  href: string;
  id: string;
  uri: string;
};

export type SpotifyImage = {
  width: number | null;
  height: number | null;
  url: string;
};

export type SpotifyUser = SpotifyId & {
  display_name: string | null;
  external_urls: SpotifyExternalUrls;
};

export type SpotifyCurrentUser = SpotifyUser & {
  images: SpotifyImage[];
};

export type SpotifyPlaylistTracksInfo = {
  total: number;
};

export type SpotifyPlaylist = SpotifyId & {
  collaborative: boolean;
  description: string | null;
  images: SpotifyImage[] | null;
  name: string;
  owner: SpotifyUser;
  public: boolean;
  snapshot_id: string;
  tracks: SpotifyPlaylistTracksInfo;
  external_urls: SpotifyExternalUrls;
};

export type SpotifyArtist = SpotifyId & {
  name: string;
  external_urls: SpotifyExternalUrls;
};

export type SpotifyAlbum = SpotifyId & {
  album_type: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  artists: SpotifyArtist[];
  total_tracks: number;
  external_urls: SpotifyExternalUrls;
};

export type SpotifyTrack = SpotifyId & {
  explicit: boolean;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  duration_ms: number;
  name: string;
  is_local: boolean;
  external_urls: SpotifyExternalUrls;
  external_ids: SpotifyExternalIds;
};

export type SpotifyPlaylistTrack = {
  added_at: string;
  added_by: SpotifyId;
  is_local: boolean;
  track: SpotifyTrack;
};

export type SpotifyPlaylistTracks = {
  total: number;
  has_more: boolean;
  tracks: SpotifyPlaylistTrack[];
};
