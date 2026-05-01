from typing import Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

STATE_KEY = "state"


class SpotifySettings(BaseModel):
    client_id: str
    client_secret: str
    scope: str = "playlist-read-private playlist-modify-private playlist-modify-public"
    callback_url: str = "http://127.0.0.1:8080/auth/callback"


class RedisSettings(BaseModel):
    url: str = "redis://redis:6379"
    password: Optional[str] = None
    max_connections: int = 10

    ttl_sessions: int = 60 * 60 * 24 * 30  # sessions, 30 days
    ttl_users: int = 60 * 60 * 2  # spotify profiles, 2 hr
    ttl_pt: int = 60 * 30  # playlist tracks, 30 min
    ttl_p: int = 60 * 2  # playlists, 2 min (to update snapshots frequently)
    ttl_tp_hit: int = 60 * 10  # track previews (hit), 10 min (url expires in 15)
    ttl_tp_miss: int = 60 * 60 * 12  # track previews (miss), 12 hours


class Settings(BaseSettings):
    spotify: SpotifySettings = Field(default_factory=SpotifySettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)

    env: str = "development"

    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"
