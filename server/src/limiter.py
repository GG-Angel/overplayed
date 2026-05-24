from settings import Settings
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(
    key_func=get_remote_address,
    enabled=not Settings().debug,
)
