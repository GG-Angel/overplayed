from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

STATE_KEY = "state"


class SpotifySettings(BaseModel):
    client_id: str
    client_secret: str
    scope: str = "playlist-read-private playlist-modify-private playlist-modify-public"
    callback_url: str = "http://server:8080/auth/callback"


class RedisSettings(BaseModel):
    url: str = "redis://redis:6379"


class Settings(BaseSettings):
    spotify: SpotifySettings = Field(default_factory=SpotifySettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)

    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="ignore",
    )
