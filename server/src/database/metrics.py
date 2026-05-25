from decimal import Decimal
from models import SwipeSessionRequest
from sqlalchemy import func, select, cast, Numeric, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import SwipeSession


class MetricRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_swipe_session(
        self, user_id: str, session: SwipeSessionRequest
    ) -> None:
        self.db.add(SwipeSession(user_id=user_id, **session.model_dump()))
        await self.db.commit()

    async def get_total_sessions(self) -> int:
        stmt = select(func.coalesce(func.count(), 0)).select_from(SwipeSession)
        return await self.db.scalar(stmt) or 0

    async def get_total_tracks_cut(self) -> int:
        stmt = select(func.coalesce(func.sum(SwipeSession.tracks_cut), 0)).select_from(
            SwipeSession
        )
        return await self.db.scalar(stmt) or 0

    async def get_unique_users(self) -> int:
        stmt = select(func.coalesce(func.count(distinct(SwipeSession.user_id)), 0))
        return await self.db.scalar(stmt) or 0

    async def get_track_cut_rate(self) -> Decimal:
        stmt = select(
            func.round(
                cast(func.coalesce(func.sum(SwipeSession.tracks_cut), 0), Numeric)
                / func.nullif(func.sum(SwipeSession.tracks_swiped), 0),
                2,
            )
        )
        return await self.db.scalar(stmt) or Decimal(0.0)

    async def get_average_swipe_duration(self) -> float:
        stmt = select(
            cast(
                func.extract(
                    "epoch", func.sum(SwipeSession.created_at - SwipeSession.started_at)
                )
                / func.nullif(func.sum(SwipeSession.tracks_swiped), 0),
                Numeric,
            )
        )
        return await self.db.scalar(stmt) or 0.0

    async def get_average_session_duration(self) -> float:
        stmt = select(
            func.extract(
                "epoch",
                func.avg(SwipeSession.created_at - SwipeSession.started_at),
            )
        )
        return await self.db.scalar(stmt) or 0.0
