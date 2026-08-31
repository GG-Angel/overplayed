from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_STATE_KEY = "APP_STATE"


class Settings(BaseSettings):
    # App settings
    app_debug: bool = False
    app_frontend_url: str = Field(...)
    app_api_url: str = Field(...)

    # Spotify settings
    spotify_client_id: str = Field(...)
    spotify_auth_client_id: str = Field(...)
    spotify_refresh_token: str = Field(...)

    # Redis settings
    redis_user: str = Field(...)
    redis_host: str = Field(...)
    redis_port: int = Field(...)
    redis_password: str = Field(...)
    redis_key: str = Field(..., min_length=44, max_length=44)

    # Secrets
    cloudflare_turnstile_secret: str = Field(...)
    resend_api_key: str = Field(...)

    # TTLs
    ttl_email_ott: int = 60 * 15  # 15 minutes
    ttl_spotify_users: int = 60 * 5  # 5 minutes
    ttl_queue_users: int = 60 * 60 * 24  # 24 hours

    # Queue limits
    queue_user_limit: int = 5
    queue_retry_limit: int = 3
    queue_poll_interval: int = 60 * 5  # 5 minutes

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_user}:{self.redis_password}@{self.redis_host}:{self.redis_port}"


settings = Settings()  # pyright: ignore[reportCallIssue]
