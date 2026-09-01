import asyncio
from collections.abc import AsyncGenerator

from src.services.spotify.models import Track

# (user_id, playlist_id, snapshot_id)
TrackStreamKey = tuple[str, str, str]


class TrackStream:
    """Helps funnel duplicate requests when fetching playlist tracks."""

    def __init__(self) -> None:
        self._tracks: list[Track] = []
        self._error: BaseException | None = None
        self._closed = False
        self._updated = asyncio.Condition()

    @property
    def tracks(self) -> list[Track]:
        """Everything published so far; complete once the stream is closed."""
        return self._tracks

    async def publish(self, tracks: list[Track]) -> None:
        if not tracks:
            return
        async with self._updated:
            self._tracks.extend(tracks)
            self._updated.notify_all()

    async def close(self, error: BaseException | None = None) -> None:
        async with self._updated:
            self._error = error
            self._closed = True
            self._updated.notify_all()

    async def follow(self) -> AsyncGenerator[Track]:
        index = 0
        while True:
            async with self._updated:
                await self._updated.wait_for(
                    lambda seen=index: seen < len(self._tracks) or self._closed
                )
                # once closed the buffer is final, so this batch is the remainder
                batch = self._tracks[index:]
                closed, error = self._closed, self._error

            index += len(batch)
            for track in batch:
                yield track

            if closed:
                if error is not None:
                    raise error
                return
