from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_STATE_KEY = "APP_STATE"


class Settings(BaseSettings):
    frontend_url: str = Field(...)

    spotify_app_client_id: str = Field(...)
    spotify_auth_client_id: str = Field(...)
    spotify_refresh_token: str = Field(...)

    redis_user: str = Field(...)
    redis_host: str = Field(...)
    redis_port: int = Field(...)
    redis_password: str = Field(...)
    redis_key: bytes = Field(..., min_length=44, max_length=44)

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_user}:{self.redis_password}@{self.redis_host}:{self.redis_port}"


settings = Settings()
