from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    spotify_url: Mapped[str] = mapped_column(String(255), nullable=False)
    picture_url: Mapped[str] = mapped_column(String(255), nullable=True)


class SwipeSession(Base):
    __tablename__ = "swipe_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255), ForeignKey(User.id, ondelete="CASCADE"), index=True, nullable=False
    )
    playlist_id: Mapped[str] = mapped_column(String(255), nullable=False)
    snapshot_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    total_tracks: Mapped[int] = mapped_column(nullable=False)
    tracks_swiped: Mapped[int] = mapped_column(nullable=False)
    tracks_cut: Mapped[int] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )
