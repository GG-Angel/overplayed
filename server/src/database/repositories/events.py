import asyncpg


class EventRepository:
    def __init__(self, db: asyncpg.Pool):
        self.db = db

    async def log_deletion(self, user_id: str, tracks_deleted: int) -> None:
        await self.db.fetchrow(
            """
            INSERT INTO track_deletions (user_id, tracks_deleted)
            VALUES ($1, $2);
            """,
            user_id,
            tracks_deleted,
        )

    async def get_total_deletions(self) -> int:
        return await self.db.fetchval(
            """
            SELECT COALESCE(SUM(tracks_deleted), 0)
            FROM track_deletions;
            """
        )
