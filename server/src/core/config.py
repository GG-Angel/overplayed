from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_STATE_KEY = "state"

ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    debug: bool = False
    frontend_url: str = "http://127.0.0.1:5173"
    callback_url: str = "http://127.0.0.1:8080/auth/callback"
    session_lifespan: int = 60 * 60 * 24 * 14  # 14 days

    spotify_client_id: str = Field(...)
    spotify_client_secret: str = Field(...)
    spotify_scope: str = "playlist-read-private playlist-modify-private playlist-modify-public user-read-email"

    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_user: str = Field(...)
    postgres_password: str = Field(...)
    postgres_db: str = Field(...)

    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: str = Field(...)
    redis_key: bytes = Field(..., min_length=32, max_length=32)

    @property
    def db_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
