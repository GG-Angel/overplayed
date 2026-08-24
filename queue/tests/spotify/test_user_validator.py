import pytest
from core.errors import SpotifyValidationError
from services.spotify.validator import (
    SpotifyUserValidator,
    build_spotify_user_validator,
)

from .common import FakeResponse, RecordingHttpClient, RequestCall

VALIDATE_URL = "https://spclient.wg.spotify.com/signup/public/v2/account/validate"
SIGNUP_URL = "https://www.spotify.com/us/signup"


def validation_call(email: str, signup_form_key: str) -> RequestCall:
    return RequestCall(
        "POST",
        VALIDATE_URL,
        {
            "json": {
                "fields": [{"field": "FIELD_EMAIL", "value": email}],
                "client_info": {"api_key": signup_form_key},
            }
        },
    )


@pytest.mark.parametrize(
    ("response_data", "expected"),
    [
        ({}, False),
        ({"error": {"already_exists": {}}}, True),
        (
            {"error": {"invalid_argument": {"field_errors": []}}},
            False,
        ),
    ],
)
async def test_user_exists_returns_expected_result(
    response_data: dict[str, object],
    expected: bool,
) -> None:
    http_client = RecordingHttpClient(
        post_responses=[FakeResponse(json_data=response_data)]
    )
    validator = SpotifyUserValidator(http_client, "signup-key")

    assert await validator.user_exists("user@example.com") is expected
    assert http_client.calls == [validation_call("user@example.com", "signup-key")]


async def test_user_exists_refreshes_signup_key_and_retries() -> None:
    http_client = RecordingHttpClient(
        get_responses=[
            FakeResponse(
                text_data='"signupServiceAppKey":"refreshed-key"',
            )
        ],
        post_responses=[
            FakeResponse(json_data={"error": {"unexpected": {}}}),
            FakeResponse(json_data={"error": {"already_exists": {}}}),
        ],
    )
    validator = SpotifyUserValidator(http_client, "stale-key")

    assert await validator.user_exists("user@example.com") is True
    assert http_client.calls == [
        validation_call("user@example.com", "stale-key"),
        RequestCall("GET", SIGNUP_URL, {}),
        validation_call("user@example.com", "refreshed-key"),
    ]


async def test_user_exists_raises_when_refreshed_key_is_rejected() -> None:
    http_client = RecordingHttpClient(
        get_responses=[FakeResponse(text_data='"signupServiceAppKey":"refreshed-key"')],
        post_responses=[
            FakeResponse(json_data={"error": {"unexpected": {}}}),
            FakeResponse(json_data={"error": {"unexpected": {}}}),
        ],
    )
    validator = SpotifyUserValidator(http_client, "stale-key")

    with pytest.raises(
        SpotifyValidationError,
        match="Signup form key invalid after refresh.",
    ):
        await validator.user_exists("user@example.com")


async def test_builder_uses_signup_key_from_spotify() -> None:
    http_client = RecordingHttpClient(
        get_responses=[FakeResponse(text_data='"signupServiceAppKey":"current-key"')],
        post_responses=[FakeResponse()],
    )

    validator = await build_spotify_user_validator(http_client)

    assert await validator.user_exists("user@example.com") is False
    assert http_client.calls == [
        RequestCall("GET", SIGNUP_URL, {}),
        validation_call("user@example.com", "current-key"),
    ]


@pytest.mark.parametrize(
    ("signup_page", "message"),
    [
        ("", "Signup key not found in source."),
        ('"signupServiceAppKey":"unterminated', "Signup key not terminated in source."),
    ],
)
async def test_builder_rejects_invalid_signup_page(
    signup_page: str,
    message: str,
) -> None:
    http_client = RecordingHttpClient(
        get_responses=[FakeResponse(text_data=signup_page)]
    )

    with pytest.raises(SpotifyValidationError, match=message):
        await build_spotify_user_validator(http_client)
