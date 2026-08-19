from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_STATE_KEY = "state"


class Settings(BaseSettings):
    # App settings
    app_debug: bool = False
    app_frontend_url: str = Field(...)
    app_callback_url: str = Field(...)

    # Spotify settings
    spotify_client_id: str = Field(...)
    spotify_client_secret: str = Field(...)
    spotify_scope: str = "user-read-email user-library-read user-library-modify playlist-read-private playlist-modify-private playlist-modify-public"

    # Postgres settings
    postgres_user: str = Field(...)
    postgres_password: str = Field(...)
    postgres_host: str = Field(...)
    postgres_port: int = Field(...)
    postgres_db: str = Field(...)

    # Redis settings
    redis_user: str = Field(...)
    redis_host: str = Field(...)
    redis_port: int = Field(...)
    redis_password: str = Field(...)
    redis_key: bytes = Field(..., min_length=32, max_length=32)

    # Cache TTLs
    ttl_sessions: int = 60 * 60 * 24 * 2  # 2 days
    ttl_users: int = 60 * 60 * 2  # 2 hours
    ttl_playlists: int = 90  # 90 seconds
    ttl_playlist_tracks: int = 60 * 60  # 1 hour
    ttl_previews_hit: int = 60 * 10  # 10 minutes
    ttl_previews_miss: int = 60 * 60 * 2  # 2 hours

    # Spotify API limits
    playlist_limit: int = 50
    playlist_tracks_limit: int = 100
    get_saved_tracks_limit: int = 50
    edit_saved_tracks_limit: int = 40
    max_pagination_offset: int = 10000  # max playlist size on spotify

    @property
    def postgres_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_user}:{self.redis_password}@{self.redis_host}:{self.redis_port}"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
