from models import SwipeSessionRequest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import SwipeSession


class MetricRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_swipe_session(
        self, user_id: str, session: SwipeSessionRequest
    ) -> None:
        self.db.add(SwipeSession(user_id=user_id, **session.model_dump()))
        await self.db.commit()

    async def total_sessions(self) -> int:
        stmt = select(func.coalesce(func.count(), 0)).select_from(SwipeSession)
        return await self.db.scalar(stmt) or 0

    async def total_tracks_cut(self) -> int:
        stmt = select(func.coalesce(func.sum(SwipeSession.tracks_cut), 0)).select_from(
            SwipeSession
        )
        return await self.db.scalar(stmt) or 0
