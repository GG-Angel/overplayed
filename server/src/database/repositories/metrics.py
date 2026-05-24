import asyncpg


class MetricRepository:
    def __init__(self, db: asyncpg.Pool):
        self.db = db

    async def log_swipes(
        self,
        user_id: str,
        playlist_id: str,
        total_tracks: int,
        tracks_cut: int,
    ) -> None:
        await self.db.fetchrow(
            """
            INSERT INTO swipes (user_id, playlist_id, total_tracks, tracks_cut)
            VALUES ($1, $2, $3, $4);
            """,
            user_id,
            playlist_id,
            total_tracks,
            tracks_cut,
        )

    async def count_sessions(self) -> int:
        return await self.db.fetchval("SELECT COUNT(*) FROM swipes;")

    async def count_tracks_cut(self) -> int:
        return await self.db.fetchval(
            """
            SELECT COALESCE(SUM(tracks_cut), 0)
            FROM swipes;
            """
        )
