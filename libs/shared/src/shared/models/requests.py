from pydantic import BaseModel, EmailStr
from redis.typing import EncodableT, FieldT


class EvictionRequest(BaseModel):
    """Request model for evicting a user from the app."""

    email: EmailStr

    def to_fields(self) -> dict[FieldT, EncodableT]:
        """Serialize the request into fields for a Redis stream entry."""
        return dict(self.model_dump().items())

    @classmethod
    def from_fields(cls, fields: dict[str, str]) -> "EvictionRequest":
        """Rebuild a request from the fields of a Redis stream entry."""
        return cls.model_validate(fields)
