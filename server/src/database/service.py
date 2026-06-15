from core.database import get_db
from sqlalchemy import func, select, distinct
from database.schemas import SwipeSession, User
from sqlalchemy.exc import IntegrityError
from loguru import logger
from fastapi import Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession


class GlobalSwipeMetrics(BaseModel):
    total_sessions: int
    total_users: int
    total_swipes: int
    total_cuts: int
    cut_rate: float


class DatabaseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_user(self, user: User) -> None:
        await self.db.merge(user)
        await self.db.commit()
        logger.info(f"Upserted user {user.id}")

    async def record_swipe_session(self, session: SwipeSession) -> None:
        try:
            self.db.add(session)
            await self.db.commit()
            logger.info(f"Recorded swipe session for user {session.user_id} with {session.tracks_swiped} swipes")  # fmt: skip
        except IntegrityError:
            logger.warning(f"Ignoring swipe session record for user {session.user_id} due to integrity error")  # fmt: skip

    async def get_global_swipe_metrics(self) -> GlobalSwipeMetrics:
        result = await self.db.execute(
            select(
                func.count(SwipeSession.id),
                func.count(distinct(SwipeSession.user_id)),
                func.coalesce(func.sum(SwipeSession.tracks_swiped), 0),
                func.coalesce(func.sum(SwipeSession.tracks_cut), 0),
            )
        )
        total_sessions, total_users, total_swipes, total_cuts = result.one()
        return GlobalSwipeMetrics(
            total_sessions=total_sessions,
            total_users=total_users,
            total_swipes=total_swipes,
            total_cuts=total_cuts,
            cut_rate=round(total_cuts / total_swipes, 2) if total_swipes else 0.0,
        )


def get_database_service(db: AsyncSession = Depends(get_db)) -> DatabaseService:
    return DatabaseService(db=db)
