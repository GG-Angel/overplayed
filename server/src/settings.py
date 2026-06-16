from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_STATE_KEY = "state"


class Settings(BaseSettings):
    debug: bool = False
    frontend_url: str = "http://127.0.0.1:5173"
    callback_url: str = "http://127.0.0.1:8080/auth/callback"

    ttl_sessions: int = 60 * 60 * 24 * 14
    ttl_users: int = 60 * 60 * 2
    ttl_playlists: int = 90
    ttl_playlist_items: int = 60 * 60
    ttl_previews_hit: int = 60 * 10
    ttl_previews_miss: int = 60 * 60 * 2

    spotify_client_id: str = Field(...)
    spotify_client_secret: str = Field(...)
    spotify_scope: str = "playlist-read-private playlist-modify-private playlist-modify-public user-read-email"

    database_user: str = Field(...)
    database_password: str = Field(...)
    database_host: str = Field(...)
    database_port: int = Field(...)
    database_db: str = Field(...)

    redis_user: str = Field(...)
    redis_host: str = Field(...)
    redis_port: int = Field(...)
    redis_password: str = Field(...)
    redis_key: bytes = Field(..., min_length=32, max_length=32)

    @property
    def db_url(self) -> str:
        return f"postgresql+asyncpg://{self.database_user}:{self.database_password}@{self.database_host}:{self.database_port}/{self.database_db}"

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_user}:{self.redis_password}@{self.redis_host}:{self.redis_port}"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
