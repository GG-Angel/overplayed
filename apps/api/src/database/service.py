from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import Depends
from loguru import logger
from sqlalchemy import distinct, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.database.schemas import SwipeSession, User


@dataclass
class GlobalSwipeAggregates:
    total_sessions: int
    total_users: int
    total_swipes: int
    total_cuts: int


@dataclass
class UserSwipeAggregates:
    num_swipes: int
    num_cuts: int
    num_modified: int


@dataclass
class LeaderboardEntry:
    user: User
    total_swipes: int
    total_cuts: int


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

    async def get_global_swipe_stats(self) -> GlobalSwipeAggregates:
        result = await self.db.execute(
            select(
                func.count(SwipeSession.id),
                func.count(distinct(SwipeSession.user_id)),
                func.coalesce(func.sum(SwipeSession.tracks_swiped), 0),
                func.coalesce(func.sum(SwipeSession.tracks_cut), 0),
            )
        )
        total_sessions, total_users, total_swipes, total_cuts = result.one()
        return GlobalSwipeAggregates(
            total_sessions=total_sessions,
            total_users=total_users,
            total_swipes=total_swipes,
            total_cuts=total_cuts,
        )

    async def get_user_swipe_stats(self, user_id: str) -> UserSwipeAggregates:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(SwipeSession.tracks_swiped), 0),
                func.coalesce(func.sum(SwipeSession.tracks_cut), 0),
                func.count(distinct(SwipeSession.playlist_id)),
            ).where(SwipeSession.user_id == user_id)
        )
        num_swipes, num_cuts, num_modified = result.one()
        return UserSwipeAggregates(
            num_swipes=num_swipes,
            num_cuts=num_cuts,
            num_modified=num_modified,
        )

    async def get_swipe_leaderboard(
        self, offset: int = 0, limit: int = 10, since: timedelta = timedelta(days=30)
    ) -> list[LeaderboardEntry]:
        total_swipes = func.coalesce(func.sum(SwipeSession.tracks_swiped), 0)
        total_cuts = func.coalesce(func.sum(SwipeSession.tracks_cut), 0)
        result = await self.db.execute(
            select(User, total_swipes, total_cuts)
            .join(SwipeSession, User.id == SwipeSession.user_id)
            .where(SwipeSession.created_at >= datetime.now(UTC) - since)
            .group_by(User.id)
            .order_by(total_cuts.desc())
            .offset(offset)
            .limit(limit)
        )
        return [
            LeaderboardEntry(user=user, total_swipes=swipes, total_cuts=cuts)
            for user, swipes, cuts in result.all()
        ]


def get_database_service(db: AsyncSession = Depends(get_db)) -> DatabaseService:
    return DatabaseService(db=db)
