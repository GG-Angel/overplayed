from types import TracebackType
from typing import Any, Protocol


class SpotifyHttpResponse(Protocol):
    """Response data used by the Spotify services."""

    async def json(self) -> Any: ...

    async def text(self) -> str: ...


class SpotifyHttpRequest(Protocol):
    """Async request context used by the Spotify services."""

    async def __aenter__(self) -> SpotifyHttpResponse: ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> bool | None: ...


class SpotifyHttpClient(Protocol):
    """Structural interface for an async HTTP client."""

    def get(self, url: str, **kwargs: Any) -> SpotifyHttpRequest: ...

    def post(self, url: str, **kwargs: Any) -> SpotifyHttpRequest: ...

    def delete(self, url: str, **kwargs: Any) -> SpotifyHttpRequest: ...
