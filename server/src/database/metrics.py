from pydantic import BaseModel
from sqlalchemy import func, select, cast, Numeric, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import SwipeSession, SwipeSessionDetails


class MetricsSummary(BaseModel):
    total_sessions: int
    total_users: int
    total_cuts: int
    cut_rate: float
    avg_swipe_duration: float
    avg_session_duration: float


class MetricsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_swipe_session(
        self,
        user_id: str,
        session: SwipeSessionDetails,
    ) -> None:
        self.db.add(SwipeSession(user_id=user_id, **session.model_dump()))
        await self.db.commit()

    async def fetch_summary(self) -> MetricsSummary:
        duration = SwipeSession.created_at - SwipeSession.started_at
        tracks_cut_sum = func.sum(SwipeSession.tracks_cut)
        tracks_swiped_sum = func.nullif(func.sum(SwipeSession.tracks_swiped), 0)

        total_sessions = func.count().label("total_sessions")
        total_users = func.count(distinct(SwipeSession.user_id)).label("total_users")
        total_cuts = tracks_cut_sum.label("total_cuts")

        cut_rate = (cast(tracks_cut_sum, Numeric) / tracks_swiped_sum).label("cut_rate")

        avg_swipe_duration = cast(
            func.extract("epoch", func.sum(duration)) / tracks_swiped_sum,
            Numeric,
        ).label("avg_swipe_duration")

        avg_session_duration = cast(
            func.extract("epoch", func.avg(duration)),
            Numeric,
        ).label("avg_session_duration")

        stmt = select(
            total_sessions,
            total_users,
            total_cuts,
            cut_rate,
            avg_swipe_duration,
            avg_session_duration,
        ).select_from(SwipeSession)

        row = (await self.db.execute(stmt)).one()

        return MetricsSummary(
            total_sessions=row.total_sessions,
            total_cuts=row.total_cuts,
            total_users=row.total_users,
            cut_rate=row.cut_rate or 0.0,
            avg_swipe_duration=row.avg_swipe_duration or 0.0,
            avg_session_duration=row.avg_session_duration or 0.0,
        )
