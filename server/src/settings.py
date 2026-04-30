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

    ttl_tokens: int = 60 * 60 * 24 * 30  # 30 days


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
