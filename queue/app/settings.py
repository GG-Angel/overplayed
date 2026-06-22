from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_STATE_KEY = "APP_STATE"


class Settings(BaseSettings):
    spotify_client_id: str = Field(...)
    spotify_bearer_token: str = Field(...)

    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: str = Field(...)

    redis_users_key: str = "queue:current-users"
    redis_queue_key: str = "queue:waiting"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def redis_url(self) -> str:
        return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}"


settings = Settings()
