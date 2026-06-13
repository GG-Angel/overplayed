from pydantic import BaseModel


IsrcPattern = r"^[A-Za-z]{2}[A-Za-z0-9]{3}[0-9]{7}$"


class TrackPreview(BaseModel):
    isrc: str
    url: str | None = None
    expires_at: int | None = None
    expires_in: int | None = None
