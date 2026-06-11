from pydantic import BaseModel


class TrackPreview(BaseModel):
    isrc: str
    url: str
    expires_at: int
    expires_in: int
