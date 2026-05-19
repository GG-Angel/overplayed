from cache.core import RedisCore


class EventCounters:
    def __init__(self, core: RedisCore):
        self.core = core

    async def increment(self, event: str, amount: int = 1) -> None:
        await self.core.increment(self._counter_key(event), amount)

    @staticmethod
    def _counter_key(event: str) -> str:
        return RedisCore.key("counters", event)
