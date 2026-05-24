from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

STATE_KEY = "state"


class SpotifySettings(BaseModel):
    client_id: str
    client_secret: str
    scope: str = "playlist-read-private playlist-modify-private playlist-modify-public"

    # pagination limits
    lim_playlists: int = 50
    lim_playlist_items: int = 100


class DeezerSettings(BaseModel):
    url: str = "https://api.deezer.com"


class PostgresSettings(BaseModel):
    user: str
    password: str
    host: str = "postgres"
    port: int = 5432
    db: str

    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.db}"


class RedisSettings(BaseModel):
    host: str = "redis"
    port: int = 6379
    password: str
    encryption_key: bytes = Field(..., min_length=32, max_length=32)

    # cache ttls
    ttl_sessions: int = 60 * 60 * 24 * 30  # sessions, 30 days
    ttl_users: int = 60 * 60 * 2  # spotify profiles, 2 hr
    ttl_playlists: int = 60 * 2  # playlists, 2 min (check snapshots frequently)
    ttl_playlist_items: int = 60 * 60 * 24 * 7  # playlist items, 7 days
    ttl_previews_hit: int = 60 * 10  # track previews (hit), 10 min (url expires in 15)
    ttl_previews_miss: int = 60 * 60 * 2  # track previews (miss), 2 hours

    @property
    def url(self) -> str:
        return f"redis://{self.host}:{self.port}"


class Settings(BaseSettings):
    spotify: SpotifySettings = Field(default_factory=SpotifySettings)
    deezer: DeezerSettings = Field(default_factory=DeezerSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    postgres: PostgresSettings = Field(default_factory=PostgresSettings)

    debug: bool = False
    frontend_url: str = "http://127.0.0.1:5173"
    callback_url: str = "http://127.0.0.1:8080/auth/callback"

    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="ignore",
    )
