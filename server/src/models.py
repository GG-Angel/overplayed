from typing import Optional, List
from pydantic import BaseModel


class TokenInfo(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    expires_at: int
    scope: str


class SessionInfo(TokenInfo):
    user_id: str


class SpotifyExternalUrls(BaseModel):
    spotify: str


class SpotifyExternalIds(BaseModel):
    isrc: str


class SpotifyId(BaseModel):
    href: str
    id: str
    uri: str


class SpotifyImage(BaseModel):
    width: Optional[int]
    height: Optional[int]
    url: str


class SpotifyUser(SpotifyId):
    display_name: Optional[str]
    external_urls: SpotifyExternalUrls


class SpotifyCurrentUser(SpotifyUser):
    images: List[SpotifyImage]


class SpotifyPlaylistTracksInfo(BaseModel):
    total: int


class SpotifyPlaylist(SpotifyId):
    collaborative: bool
    description: Optional[str]
    images: List[SpotifyImage]
    name: str
    owner: SpotifyUser
    public: bool
    snapshot_id: str
    tracks: SpotifyPlaylistTracksInfo
    external_urls: SpotifyExternalUrls


class SpotifyArtist(SpotifyId):
    name: str
    external_urls: SpotifyExternalUrls


class SpotifyAlbum(SpotifyId):
    album_type: str
    images: List[SpotifyImage]
    name: str
    release_date: str
    artists: List[SpotifyArtist]
    total_tracks: int
    external_urls: SpotifyExternalUrls


class SpotifyTrack(SpotifyId):
    explicit: bool
    album: SpotifyAlbum
    artists: List[SpotifyArtist]
    duration_ms: int
    name: str
    is_local: bool
    external_urls: SpotifyExternalUrls
    external_ids: SpotifyExternalIds


class SpotifyPlaylistTrack(BaseModel):
    added_at: str
    added_by: SpotifyId
    is_local: bool
    track: SpotifyTrack


class SpotifyTrackPreview(BaseModel):
    isrc: str
    preview_url: str
