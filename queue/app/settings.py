from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_STATE_KEY = "APP_STATE"


class Settings(BaseSettings):
    # App settings
    app_debug: bool = False
    app_frontend_url: str = Field(...)

    # Spotify settings
    spotify_client_id: str = Field(...)
    spotify_auth_client_id: str = Field(...)
    spotify_refresh_token: str = Field(...)

    # Redis settings
    redis_user: str = Field(...)
    redis_host: str = Field(...)
    redis_port: int = Field(...)
    redis_password: str = Field(...)
    redis_key: bytes = Field(..., min_length=44, max_length=44)

    # Secrets
    cloudflare_turnstile_secret: str = Field(...)
    resend_api_key: str = Field(...)

    # Cache TTLs
    email_ott_ex: int = 900

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_user}:{self.redis_password}@{self.redis_host}:{self.redis_port}"


settings = Settings()
