from datetime import datetime, timezone, timedelta
from typing import List
from core.database import get_db
from sqlalchemy import func, select, distinct
from database.schemas import SwipeSession, User
from sqlalchemy.exc import IntegrityError
from loguru import logger
from fastapi import Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession


class UserSwipeMetrics(BaseModel):
    num_swipes: int
    num_modified: int
    num_cuts: int
    num_kept: int
    cut_rate: float


class GlobalSwipeMetrics(BaseModel):
    total_swipes: int
    total_cuts: int
    cut_rate: float
    total_sessions: int
    total_users: int


class LeaderboardRow(BaseModel):
    class User(BaseModel):
        id: str
        display_name: str | None
        spotify_url: str
        picture_url: str | None

        model_config = ConfigDict(from_attributes=True)

    class Metrics(BaseModel):
        total_swipes: int
        total_cuts: int
        cut_rate: float

    user: User
    metrics: Metrics


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

    async def get_user_swipe_metrics(
        self, user_id: str, since: timedelta = timedelta(days=30)
    ) -> UserSwipeMetrics:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(SwipeSession.tracks_swiped), 0),
                func.coalesce(func.sum(SwipeSession.tracks_cut), 0),
                func.count(distinct(SwipeSession.playlist_id)),
            ).where(
                SwipeSession.user_id == user_id,
                SwipeSession.created_at >= datetime.now(timezone.utc) - since,
            )
        )
        num_swipes, num_cuts, num_modified = result.one()
        return UserSwipeMetrics(
            num_swipes=num_swipes,
            num_cuts=num_cuts,
            num_modified=num_modified,
            num_kept=max(0, num_swipes - num_cuts),
            cut_rate=round(num_cuts / num_swipes, 2) if num_swipes > 0 else 0.0,
        )

    async def get_swipe_leaderboard(
        self, offset: int = 0, limit: int = 10, since: timedelta = timedelta(days=30)
    ) -> List[LeaderboardRow]:
        total_swipes = func.coalesce(func.sum(SwipeSession.tracks_swiped), 0)
        total_cuts = func.coalesce(func.sum(SwipeSession.tracks_cut), 0)
        result = await self.db.execute(
            select(User, total_swipes, total_cuts)
            .join(SwipeSession, User.id == SwipeSession.user_id)
            .where(SwipeSession.created_at >= datetime.now(timezone.utc) - since)
            .group_by(User.id)
            .order_by(total_cuts.desc())
            .offset(offset)
            .limit(limit)
        )
        return [
            LeaderboardRow(
                user=LeaderboardRow.User.model_validate(user),
                metrics=LeaderboardRow.Metrics(
                    total_swipes=swipes,
                    total_cuts=cuts,
                    cut_rate=round(cuts / swipes, 2) if swipes > 0 else 0.0,
                ),
            )
            for user, swipes, cuts in result.all()
        ]


def get_database_service(db: AsyncSession = Depends(get_db)) -> DatabaseService:
    return DatabaseService(db=db)
