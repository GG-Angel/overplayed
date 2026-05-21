from typing import Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

STATE_KEY = "state"


class SpotifySettings(BaseModel):
    client_id: str
    client_secret: str
    scope: str = "playlist-read-private playlist-modify-private playlist-modify-public"
    callback_url: str = "http://127.0.0.1:8080/auth/callback"

    # pagination limits
    lim_playlists: int = 50
    lim_playlist_items: int = 100


class DeezerSettings(BaseModel):
    base_url: str = "https://api.deezer.com"


class PostgresSettings(BaseModel):
    password: str

    # pool config
    min_pool_size = 5
    max_pool_size = 20
    command_timeout = 10

    @property
    def url(self) -> str:
        return f"postgres://postgres:{self.password}@localhost:5432/database"


class RedisSettings(BaseModel):
    url: str = "redis://redis:6379"
    password: Optional[str] = None

    encryption_key: bytes = Field(..., min_length=32, max_length=32)
    max_connections: int = 10

    ttl_sessions: int = 60 * 60 * 24 * 30  # sessions, 30 days
    ttl_users: int = 60 * 60 * 2  # spotify profiles, 2 hr
    ttl_playlists: int = 60 * 2  # playlists, 2 min (check snapshots frequently)
    ttl_playlist_items: int = 60 * 60 * 24 * 7  # playlist items, 7 days
    ttl_previews_hit: int = 60 * 10  # track previews (hit), 10 min (url expires in 15)
    ttl_previews_miss: int = 60 * 60 * 2  # track previews (miss), 2 hours


class Settings(BaseSettings):
    spotify: SpotifySettings = Field(default_factory=SpotifySettings)
    deezer: DeezerSettings = Field(default_factory=DeezerSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    postgres: PostgresSettings = Field(default_factory=PostgresSettings)

    env: str = "development"
    frontend_url: str = "http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"
