from typing import Optional, List, Annotated
from pydantic import BaseModel, Field

_SpotifyIdInner = r"[0-9A-Za-z]{22}"

SpotifyIdPattern = rf"^{_SpotifyIdInner}$"
SpotifyUriPattern = rf"^spotify:track:{_SpotifyIdInner}$"


class ExternalUrls(BaseModel):
    spotify: str


class ExternalIds(BaseModel):
    isrc: str


class Resource(BaseModel):
    href: str
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


class PlaylistItems(BaseModel):
    total: int
    has_more: bool
    items: List[PlaylistItem]


class SwipesFormOptions(BaseModel):
    backup_enabled: bool


class SwipesForm(BaseModel):
    options: SwipesFormOptions
    uris: List[Annotated[str, Field(pattern=SpotifyUriPattern)]] = Field(min_length=1)


class SwipesResponse(BaseModel):
    backup_playlist: Playlist | None = None
