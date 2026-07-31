from pydantic import BaseModel

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


class Resource(BaseModel):
    id: str
    uri: str


class Image(BaseModel):
    width: int | None
    height: int | None
    url: str


class User(Resource):
    display_name: str | None
    external_urls: ExternalUrls


class CurrentUser(User):
    email: str
    images: list[Image]


class Playlist(Resource):
    class Tracks(BaseModel):
        total: int

    collaborative: bool
    description: str | None
    images: list[Image] | None
    name: str
    owner: User
    public: bool
    snapshot_id: str
    tracks: Tracks
    external_urls: ExternalUrls


class Artist(Resource):
    name: str
    external_urls: ExternalUrls


class Album(Resource):
    album_type: str
    images: list[Image]
    name: str
    release_date: str
    artists: list[Artist]
    total_tracks: int
    external_urls: ExternalUrls


class Track(Resource):
    class ExternalIds(BaseModel):
        isrc: str

    explicit: bool
    album: Album
    artists: list[Artist]
    duration_ms: int
    name: str
    is_local: bool
    external_urls: ExternalUrls
    external_ids: ExternalIds


class PlaylistPage(BaseModel):
    has_more: bool
    next_offset: int | None
    tracks: list[Track]
