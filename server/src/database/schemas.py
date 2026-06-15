from core.database import Base
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import mapped_column, Mapped


class SwipeSession(Base):
    __tablename__ = "swipe_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    playlist_id: Mapped[str] = mapped_column(String(255))
    snapshot_id: Mapped[str] = mapped_column(String(255), unique=True)
    total_tracks: Mapped[int]
    tracks_swiped: Mapped[int]
    tracks_cut: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())  # fmt: skip
