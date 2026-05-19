from cache.core import RedisCore

# TODO: what events do we want to count?


class EventCounters:
    def __init__(self, core: RedisCore):
        self.core = core
