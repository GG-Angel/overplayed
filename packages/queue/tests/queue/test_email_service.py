import asyncio
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import pytest
from fakeredis.aioredis import FakeRedis
from services.queue.email import EmailService

TOKEN = "fixed-token"
TOKEN_TTL_SECONDS = 300
VERIFICATION_URL_TEMPLATE = "https://queue.example.com/verify/{token}"


@dataclass(frozen=True)
class SendCall:
    to: str
    template_id: str
    variables: dict[str, Any]


class RecordingEmailSender:
    def __init__(self, error: Exception | None = None) -> None:
        self.calls: list[SendCall] = []
        self._error = error

    async def send_async(
        self, *, to: str, template_id: str, variables: dict[str, Any]
    ) -> object:
        self.calls.append(SendCall(to=to, template_id=template_id, variables=variables))
        await asyncio.sleep(0)

        if self._error is not None:
            raise self._error

        return object()


@pytest.fixture
def email_sender() -> RecordingEmailSender:
    return RecordingEmailSender()


@pytest.fixture
def token_factory() -> Callable[[], str]:
    return lambda: TOKEN


@pytest.fixture
def email_service(
    redis_client: FakeRedis,
    email_sender: RecordingEmailSender,
    token_factory: Callable[[], str],
) -> EmailService:
    return EmailService(
        redis=redis_client,
        email_sender=email_sender,
        token_ttl_seconds=TOKEN_TTL_SECONDS,
        verification_url_template=VERIFICATION_URL_TEMPLATE,
        token_factory=token_factory,
    )


async def test_register_user_reserves_token_and_sends_verification_email(
    email_service: EmailService,
    redis_client: FakeRedis,
    email_sender: RecordingEmailSender,
) -> None:
    registered = await email_service.register_user("  User@Example.COM ")

    assert registered is True
    assert await redis_client.get("queue:email_tokens:user@example.com") == TOKEN
    assert (
        await redis_client.get(f"queue:one_time_tokens:{TOKEN}") == "user@example.com"
    )
    assert (
        0
        < await redis_client.ttl("queue:email_tokens:user@example.com")
        <= TOKEN_TTL_SECONDS
    )
    assert (
        0
        < await redis_client.ttl(f"queue:one_time_tokens:{TOKEN}")
        <= TOKEN_TTL_SECONDS
    )
    assert email_sender.calls == [
        SendCall(
            to="user@example.com",
            template_id="email-verification",
            variables={
                "email": "user@example.com",
                "verification_url": f"https://queue.example.com/verify/{TOKEN}",
            },
        )
    ]


async def test_register_user_does_not_replace_pending_token(
    email_service: EmailService,
    redis_client: FakeRedis,
    email_sender: RecordingEmailSender,
) -> None:
    await redis_client.set("queue:email_tokens:user@example.com", "existing-token")

    registered = await email_service.register_user("USER@example.com")

    assert registered is False
    assert (
        await redis_client.get("queue:email_tokens:user@example.com")
        == "existing-token"
    )
    assert await redis_client.get(f"queue:one_time_tokens:{TOKEN}") is None
    assert email_sender.calls == []


async def test_register_user_keeps_token_when_email_delivery_fails(
    redis_client: FakeRedis,
    token_factory: Callable[[], str],
) -> None:
    email_sender = RecordingEmailSender(RuntimeError("delivery failed"))
    email_service = EmailService(
        redis=redis_client,
        email_sender=email_sender,
        token_ttl_seconds=TOKEN_TTL_SECONDS,
        verification_url_template=VERIFICATION_URL_TEMPLATE,
        token_factory=token_factory,
    )

    registered = await email_service.register_user("user@example.com")

    assert registered is True
    assert await redis_client.get("queue:email_tokens:user@example.com") == TOKEN
    assert len(email_sender.calls) == 1


async def test_resolve_email_from_token_consumes_token_and_email_reservation(
    email_service: EmailService,
    redis_client: FakeRedis,
) -> None:
    await redis_client.set(f"queue:one_time_tokens:{TOKEN}", "user@example.com")
    await redis_client.set("queue:email_tokens:user@example.com", TOKEN)

    email = await email_service.resolve_email_from_token(TOKEN)

    assert email == "user@example.com"
    assert await redis_client.get(f"queue:one_time_tokens:{TOKEN}") is None
    assert await redis_client.get("queue:email_tokens:user@example.com") is None


async def test_resolve_email_from_unknown_token_returns_none(
    email_service: EmailService,
) -> None:
    assert await email_service.resolve_email_from_token("unknown-token") is None


async def test_has_pending_token_normalizes_email(
    email_service: EmailService,
    redis_client: FakeRedis,
) -> None:
    assert await email_service.has_pending_token(" User@Example.COM ") is False

    await redis_client.set("queue:email_tokens:user@example.com", TOKEN)

    assert await email_service.has_pending_token(" User@Example.COM ") is True


async def test_send_onboarded_email_sends_expected_template(
    email_service: EmailService,
    email_sender: RecordingEmailSender,
) -> None:
    sent = await email_service.send_onboarded_email("user@example.com")

    assert sent is True
    assert email_sender.calls == [
        SendCall(
            to="user@example.com",
            template_id="onboarded-email",
            variables={"email": "user@example.com"},
        )
    ]


async def test_send_onboarded_email_returns_false_on_delivery_failure(
    redis_client: FakeRedis,
    token_factory: Callable[[], str],
) -> None:
    email_service = EmailService(
        redis=redis_client,
        email_sender=RecordingEmailSender(RuntimeError("delivery failed")),
        token_ttl_seconds=TOKEN_TTL_SECONDS,
        verification_url_template=VERIFICATION_URL_TEMPLATE,
        token_factory=token_factory,
    )

    assert await email_service.send_onboarded_email("user@example.com") is False
