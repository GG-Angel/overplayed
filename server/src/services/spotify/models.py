from typing import Optional, List, Annotated
from pydantic import BaseModel, Field, PositiveInt

LIKED_SONGS_ID = "liked-songs"
SpotifyIdPattern = r"[0-9A-Za-z]{22}"
SpotifyIdRegex = rf"^{SpotifyIdPattern}$"
TrackUriRegex = rf"^spotify:track:{SpotifyIdPattern}$"
PlaylistIdRegex = rf"^({LIKED_SONGS_ID}|{SpotifyIdPattern})$"


class TokenInfo(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    expires_at: int
    scope: str


class SessionInfo(TokenInfo):
    user_id: str


class ExternalUrls(BaseModel):
    spotify: str


class ExternalIds(BaseModel):
    isrc: str


class Resource(BaseModel):
    id: str
    uri: str


class Image(BaseModel):
    width: Optional[int]
    height: Optional[int]
    url: str


class User(Resource):
    display_name: Optional[str]
    external_urls: ExternalUrls


class CurrentUser(User):
    email: str
    images: List[Image]


class PlaylistItemCount(BaseModel):
    total: int


class Playlist(Resource):
    collaborative: bool
    description: Optional[str]
    images: Optional[List[Image]]
    name: str
    owner: User
    public: bool
    snapshot_id: str
    tracks: PlaylistItemCount
    external_urls: ExternalUrls


class Artist(Resource):
    name: str
    external_urls: ExternalUrls


class Album(Resource):
    album_type: str
    images: List[Image]
    name: str
    release_date: str
    artists: List[Artist]
    total_tracks: int
    external_urls: ExternalUrls


class Track(Resource):
    explicit: bool
    album: Album
    artists: List[Artist]
    duration_ms: int
    name: str
    is_local: bool
    external_urls: ExternalUrls
    external_ids: ExternalIds


class PlaylistItem(BaseModel):
    added_at: str
    added_by: Resource
    is_local: bool
    track: Track


class PlaylistPageMetadata(BaseModel):
    has_more: bool
    next_offset: int | None


class PlaylistPage(BaseModel):
    metadata: PlaylistPageMetadata
    items: List[PlaylistItem]


class SwipesFormOptions(BaseModel):
    backup_enabled: bool


class SwipesForm(BaseModel):
    options: SwipesFormOptions
    uris: List[Annotated[str, Field(pattern=TrackUriRegex)]] = Field(min_length=1)
    tracks_swiped: PositiveInt


class SwipesResponse(BaseModel):
    backup_playlist: Playlist | None = None
