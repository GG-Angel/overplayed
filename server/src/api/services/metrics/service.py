from sqlalchemy.ext.asyncio import AsyncSession


class MetricsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    