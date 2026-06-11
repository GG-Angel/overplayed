from pydantic import BaseModel
from sqlalchemy import func, select, cast, Numeric, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import SwipeSession, SwipeSessionDetails


class MetricsSummary(BaseModel):
    total_sessions: int
    total_users: int
    total_swipes: int
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
        swipe_sum = func.sum(SwipeSession.tracks_swiped)
        cut_sum = func.sum(SwipeSession.tracks_cut)

        total_sessions = func.count().label("total_sessions")
        total_users = func.count(distinct(SwipeSession.user_id)).label("total_users")
        total_swipes = func.coalesce(swipe_sum, 0).label("total_swipes")
        total_cuts = func.coalesce(cut_sum, 0).label("total_cuts")

        duration = SwipeSession.created_at - SwipeSession.started_at
        swipes_divisor = func.nullif(swipe_sum, 0)

        cut_rate = func.coalesce(cast(cut_sum, Numeric) / swipes_divisor, 0).label(
            "cut_rate"
        )

        avg_swipe_duration = func.coalesce(
            cast(
                func.extract("epoch", func.sum(duration)) / swipes_divisor,
                Numeric,
            ),
            0,
        ).label("avg_swipe_duration")

        avg_session_duration = func.coalesce(
            cast(func.extract("epoch", func.avg(duration)), Numeric), 0
        ).label("avg_session_duration")

        stmt = select(
            total_sessions,
            total_users,
            total_swipes,
            total_cuts,
            cut_rate,
            avg_swipe_duration,
            avg_session_duration,
        ).select_from(SwipeSession)

        row = (await self.db.execute(stmt)).mappings().one()
        return MetricsSummary.model_validate(dict(row))
