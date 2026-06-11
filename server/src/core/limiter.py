from slowapi.util import get_remote_address
from slowapi import Limiter
from .config import settings


limiter = Limiter(
    key_func=get_remote_address,
    enabled=not settings.debug,
)
