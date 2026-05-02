from typing import Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

STATE_KEY = "state"


class SpotifySettings(BaseModel):
    client_id: str
    client_secret: str
    scope: str = "playlist-read-private playlist-modify-private playlist-modify-public"
    callback_url: str = "http://127.0.0.1:8080/auth/callback"

    lim_playlists: int = 50
    lim_tracks: int = 100


class DeezerSettings(BaseModel):
    url: str = "https://api.deezer.com"


class RedisSettings(BaseModel):
    url: str = "redis://redis:6379"
    password: Optional[str] = None
    max_connections: int = 10

    ttl_sessions: int = 60 * 60 * 24 * 30  # sessions, 30 days
    ttl_users: int = 60 * 60 * 2  # spotify profiles, 2 hr
    ttl_playlists: int = 60 * 2  # playlists, 2 min (to update snapshots frequently)
    ttl_tracks: int = 60 * 30  # playlist tracks, 30 min
    ttl_tp_hit: int = 60 * 10  # track previews (hit), 10 min (url expires in 15)
    ttl_tp_miss: int = 60 * 60 * 12  # track previews (miss), 12 hours


class Settings(BaseSettings):
    spotify: SpotifySettings = Field(default_factory=SpotifySettings)
    deezer: DeezerSettings = Field(default_factory=DeezerSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)

    env: str = "development"

    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"
