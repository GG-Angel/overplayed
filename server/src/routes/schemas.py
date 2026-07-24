from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from database.service import (
    GlobalSwipeAggregates,
    LeaderboardEntry,
    UserSwipeAggregates,
)


class _Schema(BaseModel):
    """Base for public HTTP response schemas."""

    model_config = ConfigDict(from_attributes=True)


# --- Spotify response schemas ---


class ExternalUrlsResponse(_Schema):
    spotify: str


class ImageResponse(_Schema):
    width: Optional[int]
    height: Optional[int]
    url: str


class UserResponse(_Schema):
    id: str
    uri: str
    display_name: Optional[str]
    external_urls: ExternalUrlsResponse


class CurrentUserResponse(UserResponse):
    email: str
    images: List[ImageResponse]


class ArtistResponse(_Schema):
    id: str
    uri: str
    name: str
    external_urls: ExternalUrlsResponse


class AlbumResponse(_Schema):
    id: str
    uri: str
    album_type: str
    images: List[ImageResponse]
    name: str
    release_date: str
    artists: List[ArtistResponse]
    total_tracks: int
    external_urls: ExternalUrlsResponse


class TrackResponse(_Schema):
    class ExternalIds(_Schema):
        isrc: str

    id: str
    uri: str
    explicit: bool
    album: AlbumResponse
    artists: List[ArtistResponse]
    duration_ms: int
    name: str
    is_local: bool
    external_urls: ExternalUrlsResponse
    external_ids: ExternalIds


class PlaylistResponse(_Schema):
    class Tracks(_Schema):
        total: int

    id: str
    uri: str
    collaborative: bool
    description: Optional[str]
    images: Optional[List[ImageResponse]]
    name: str
    owner: UserResponse
    public: bool
    snapshot_id: str
    tracks: Tracks
    external_urls: ExternalUrlsResponse


class PlaylistPageResponse(_Schema):
    has_more: bool
    next_offset: int | None
    tracks: List[TrackResponse]


class SwipesResponse(_Schema):
    backup_playlist: PlaylistResponse | None = None


# --- Swipe-metrics response schemas ---


class GlobalSwipeMetricsResponse(BaseModel):
    total_swipes: int
    total_cuts: int
    cut_rate: float
    total_sessions: int
    total_users: int

    @classmethod
    def from_aggregates(
        cls, agg: GlobalSwipeAggregates
    ) -> "GlobalSwipeMetricsResponse":
        return cls(
            total_sessions=agg.total_sessions,
            total_users=agg.total_users,
            total_swipes=agg.total_swipes,
            total_cuts=agg.total_cuts,
            cut_rate=_cut_rate(agg.total_cuts, agg.total_swipes),
        )


class UserSwipeMetricsResponse(BaseModel):
    num_swipes: int
    num_modified: int
    num_cuts: int
    num_kept: int
    cut_rate: float

    @classmethod
    def from_aggregates(cls, agg: UserSwipeAggregates) -> "UserSwipeMetricsResponse":
        return cls(
            num_swipes=agg.num_swipes,
            num_cuts=agg.num_cuts,
            num_modified=agg.num_modified,
            num_kept=max(0, agg.num_swipes - agg.num_cuts),
            cut_rate=_cut_rate(agg.num_cuts, agg.num_swipes),
        )


class LeaderboardResponse(BaseModel):
    class User(_Schema):
        id: str
        display_name: str | None
        spotify_url: str
        picture_url: str | None

    class Metrics(BaseModel):
        total_swipes: int
        total_cuts: int
        cut_rate: float

    user: User
    metrics: Metrics

    @classmethod
    def from_entry(cls, entry: LeaderboardEntry) -> "LeaderboardResponse":
        return cls(
            user=cls.User.model_validate(entry.user),
            metrics=cls.Metrics(
                total_swipes=entry.total_swipes,
                total_cuts=entry.total_cuts,
                cut_rate=_cut_rate(entry.total_cuts, entry.total_swipes),
            ),
        )


def _cut_rate(cuts: int, swipes: int) -> float:
    return round(cuts / swipes, 2) if swipes > 0 else 0.0
