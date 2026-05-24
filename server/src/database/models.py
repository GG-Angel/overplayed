from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, func, String
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase


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
    user_id: Mapped[str] = mapped_column(String(22), index=True)
    playlist_id: Mapped[str] = mapped_column(String(22), index=True)
    total_tracks: Mapped[int]
    tracks_swiped: Mapped[int]
    tracks_cut: Mapped[int]
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
