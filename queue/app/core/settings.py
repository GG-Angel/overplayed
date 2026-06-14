from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    spotify_client_id: str = Field(...)
    spotify_client_secret: str = Field(...)
    spotify_bearer_token: str = Field(...)

    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: str = Field(...)

    app_state_key: str = "APP_STATE"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"


settings = Settings()
