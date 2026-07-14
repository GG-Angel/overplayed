import pytest
from unittest.mock import AsyncMock
from errors import SpotifyValidationError
from services.spotify import SpotifyUserValidator


SIGNUP_HTML_TEMPLATE = '<script>window.data = {{"signupServiceAppKey":"{key}","other":1}}</script>'


class TestGetSignupFormKey:
    async def test_happy_path_extracts_key(self, mock_http, make_async_cm, make_http_response):
        html = SIGNUP_HTML_TEMPLATE.format(key="abc123key")
        mock_http.get.return_value = make_async_cm(make_http_response(text_data=html))

        key = await SpotifyUserValidator.get_signup_form_key(mock_http)

        assert key == "abc123key"
        mock_http.get.assert_called_once_with("https://www.spotify.com/us/signup")

    async def test_boundary_marker_missing_raises(
        self, mock_http, make_async_cm, make_http_response
    ):
        mock_http.get.return_value = make_async_cm(
            make_http_response(text_data="<html>no marker here</html>")
        )

        with pytest.raises(SpotifyValidationError, match="not found"):
            await SpotifyUserValidator.get_signup_form_key(mock_http)

    async def test_boundary_unterminated_key_raises(
        self, mock_http, make_async_cm, make_http_response
    ):
        html = '"signupServiceAppKey":"unterminated'
        mock_http.get.return_value = make_async_cm(make_http_response(text_data=html))

        with pytest.raises(SpotifyValidationError, match="not terminated"):
            await SpotifyUserValidator.get_signup_form_key(mock_http)


class TestCreate:
    async def test_happy_path_builds_instance_with_fetched_key(
        self, mock_http, make_async_cm, make_http_response
    ):
        html = SIGNUP_HTML_TEMPLATE.format(key="fetched-key")
        mock_http.get.return_value = make_async_cm(make_http_response(text_data=html))

        validator = await SpotifyUserValidator.create(mock_http)

        assert isinstance(validator, SpotifyUserValidator)
        assert validator._signup_form_key == "fetched-key"


class TestUserExists:
    async def test_happy_path_no_error_means_user_does_not_exist(
        self, mock_http, make_async_cm, make_http_response
    ):
        mock_http.get.return_value = make_async_cm(make_http_response(json_data={}))
        validator = SpotifyUserValidator(mock_http, "signup-key")

        assert await validator.user_exists("nobody@example.com") is False

    async def test_happy_path_already_exists_error_means_user_exists(
        self, mock_http, make_async_cm, make_http_response
    ):
        mock_http.get.return_value = make_async_cm(
            make_http_response(json_data={"error": {"already_exists": True}})
        )
        validator = SpotifyUserValidator(mock_http, "signup-key")

        assert await validator.user_exists("someone@example.com") is True

    async def test_boundary_field_errors_means_invalid_email(
        self, mock_http, make_async_cm, make_http_response
    ):
        mock_http.get.return_value = make_async_cm(
            make_http_response(
                json_data={
                    "error": {"invalid_argument": {"field_errors": ["bad email"]}}
                }
            )
        )
        validator = SpotifyUserValidator(mock_http, "signup-key")

        assert await validator.user_exists("not-an-email") is False

    async def test_refreshes_key_and_retries_once_then_succeeds(
        self, mock_http, make_async_cm, make_http_response, mocker
    ):
        # First call: an ambiguous error (no already_exists, no field_errors) triggers a
        # key refresh + retry. Second call (post-refresh) succeeds with already_exists.
        responses = [
            make_async_cm(make_http_response(json_data={"error": {"unexpected": True}})),
            make_async_cm(
                make_http_response(json_data={"error": {"already_exists": True}})
            ),
        ]
        mock_http.get.side_effect = responses
        validator = SpotifyUserValidator(mock_http, "stale-key")
        mocker.patch.object(
            SpotifyUserValidator,
            "get_signup_form_key",
            AsyncMock(return_value="fresh-key"),
        )

        result = await validator.user_exists("someone@example.com")

        assert result is True
        assert validator._signup_form_key == "fresh-key"

    async def test_exception_raised_when_still_invalid_after_retry(
        self, mock_http, make_async_cm, make_http_response, mocker
    ):
        responses = [
            make_async_cm(make_http_response(json_data={"error": {"unexpected": True}})),
            make_async_cm(make_http_response(json_data={"error": {"still_bad": True}})),
        ]
        mock_http.get.side_effect = responses
        validator = SpotifyUserValidator(mock_http, "stale-key")
        mocker.patch.object(
            SpotifyUserValidator,
            "get_signup_form_key",
            AsyncMock(return_value="fresh-key"),
        )

        with pytest.raises(SpotifyValidationError, match="invalid after refresh"):
            await validator.user_exists("someone@example.com")


