from models import SpotifyIdPattern
from typing import Annotated
from pydantic import BaseModel, Field, model_validator
from datetime import datetime, timezone
from sqlalchemy import CheckConstraint, DateTime, func, String
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase


class SwipeSessionDetails(BaseModel):
    playlist_id: Annotated[str, Field(pattern=SpotifyIdPattern)]
    total_tracks: Annotated[int, Field(gt=0)]
    tracks_swiped: Annotated[int, Field(ge=0)]
    tracks_cut: Annotated[int, Field(ge=0)]
    started_at: datetime

    @model_validator(mode="after")
    def check_counts(self) -> "SwipeSessionDetails":
        if self.started_at > datetime.now(timezone.utc):
            raise ValueError("started_at cannot be in the future")
        if self.tracks_swiped > self.total_tracks:
            raise ValueError("tracks_swiped cannot exceed total_tracks")
        if self.tracks_cut > self.tracks_swiped:
            raise ValueError("tracks_cut cannot exceed tracks_swiped")
        return self


class Base(DeclarativeBase):
    pass


class SwipeSession(Base):
    __tablename__ = "swipe_sessions"
    __table_args__ = (
        CheckConstraint("total_tracks > 0", name="ck_total_tracks_positive"),
        CheckConstraint(
            "tracks_swiped >= 0 AND tracks_swiped <= total_tracks",
            name="ck_tracks_swiped_in_range",
        ),
        CheckConstraint(
            "tracks_cut >= 0 AND tracks_cut <= tracks_swiped",
            name="ck_tracks_cut_in_range",
        ),
        CheckConstraint(
            "started_at <= created_at",
            name="ck_started_at_le_created_at",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    playlist_id: Mapped[str] = mapped_column(String(255), index=True)
    total_tracks: Mapped[int]
    tracks_swiped: Mapped[int]
    tracks_cut: Mapped[int]
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
