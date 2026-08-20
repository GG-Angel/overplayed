import asyncio
from dataclasses import dataclass
from types import TracebackType
from typing import Any


@dataclass(frozen=True)
class RequestCall:
    method: str
    url: str
    kwargs: dict[str, Any]


class FakeResponse:
    def __init__(
        self,
        json_data: dict[str, object] | None = None,
        *,
        text_data: str = "",
        error: Exception | None = None,
    ) -> None:
        self._json_data = json_data or {}
        self._text_data = text_data
        self._error = error

    async def json(self) -> dict[str, object]:
        await asyncio.sleep(0)
        return self._json_data

    async def text(self) -> str:
        await asyncio.sleep(0)
        return self._text_data


class FakeRequest:
    def __init__(self, response: FakeResponse) -> None:
        self._response = response

    async def __aenter__(self) -> FakeResponse:
        if self._response._error is not None:
            raise self._response._error
        return self._response

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        return None


class RecordingHttpClient:
    def __init__(
        self,
        *,
        get_responses: list[FakeResponse] | None = None,
        post_responses: list[FakeResponse] | None = None,
        delete_responses: list[FakeResponse] | None = None,
    ) -> None:
        self.calls: list[RequestCall] = []
        self._get_responses = get_responses or []
        self._post_responses = post_responses or []
        self._delete_responses = delete_responses or []

    def _request(
        self,
        method: str,
        url: str,
        responses: list[FakeResponse],
        kwargs: dict[str, Any],
    ) -> FakeRequest:
        self.calls.append(RequestCall(method, url, kwargs))
        if not responses:
            raise AssertionError(f"Unexpected {method} request to {url}")
        return FakeRequest(responses.pop(0))

    def get(self, url: str, **kwargs: Any) -> FakeRequest:
        return self._request("GET", url, self._get_responses, kwargs)

    def post(self, url: str, **kwargs: Any) -> FakeRequest:
        return self._request("POST", url, self._post_responses, kwargs)

    def delete(self, url: str, **kwargs: Any) -> FakeRequest:
        return self._request("DELETE", url, self._delete_responses, kwargs)
