import pytest
from cryptography.fernet import Fernet
from errors import SpotifyTokenError
from services.spotify import SpotifyTokenProvider


def make_provider(mock_http, fake_redis, fernet_key):
    return SpotifyTokenProvider(
        http=mock_http,
        redis=fake_redis,
        crypto=Fernet(fernet_key),
        auth_client_id="client-id",
    )


class TestSeedToken:
    async def test_happy_path_persists_token(
        self, mock_http, fake_redis, fernet_key, make_async_cm, make_http_response
    ):
        mock_http.post.return_value = make_async_cm(
            make_http_response(
                json_data={
                    "access_token": "access-1",
                    "refresh_token": "refresh-1",
                    "expires_in": 3600,
                }
            )
        )
        provider = make_provider(mock_http, fake_redis, fernet_key)

        await provider.seed_token("initial-refresh-token")

        assert await fake_redis.exists(provider._access_token_key)
        assert await fake_redis.exists(provider._refresh_token_key)
        assert await provider.get_token() == "access-1"

    async def test_boundary_existing_refresh_token_is_noop(
        self, mock_http, fake_redis, fernet_key
    ):
        provider = make_provider(mock_http, fake_redis, fernet_key)
        await fake_redis.set(provider._refresh_token_key, "already-there")

        await provider.seed_token("new-refresh-token")

        mock_http.post.assert_not_called()
        assert await fake_redis.get(provider._refresh_token_key) == b"already-there"

    async def test_exception_renew_failure_raises_token_error(
        self, mock_http, fake_redis, fernet_key
    ):
        mock_http.post.side_effect = RuntimeError("network down")
        provider = make_provider(mock_http, fake_redis, fernet_key)

        with pytest.raises(SpotifyTokenError, match="Failed to seed refresh token"):
            await provider.seed_token("initial-refresh-token")


class TestGetToken:
    async def test_happy_path_returns_cached_access_token(
        self, mock_http, fake_redis, fernet_key
    ):
        provider = make_provider(mock_http, fake_redis, fernet_key)
        await fake_redis.set(
            provider._access_token_key, provider._encrypt("cached-access")
        )

        token = await provider.get_token()

        assert token == "cached-access"
        mock_http.post.assert_not_called()

    async def test_happy_path_renews_using_refresh_token_when_access_missing(
        self, mock_http, fake_redis, fernet_key, make_async_cm, make_http_response
    ):
        provider = make_provider(mock_http, fake_redis, fernet_key)
        await fake_redis.set(
            provider._refresh_token_key, provider._encrypt("stored-refresh")
        )
        mock_http.post.return_value = make_async_cm(
            make_http_response(
                json_data={
                    "access_token": "renewed-access",
                    "refresh_token": "renewed-refresh",
                    "expires_in": 3600,
                }
            )
        )

        token = await provider.get_token()

        assert token == "renewed-access"
        assert await fake_redis.exists(provider._access_token_key)

    async def test_exception_no_refresh_token_raises_token_error(
        self, mock_http, fake_redis, fernet_key
    ):
        provider = make_provider(mock_http, fake_redis, fernet_key)

        with pytest.raises(SpotifyTokenError, match="No refresh token available"):
            await provider.get_token()

    async def test_exception_renew_failure_raises_token_error(
        self, mock_http, fake_redis, fernet_key
    ):
        provider = make_provider(mock_http, fake_redis, fernet_key)
        await fake_redis.set(
            provider._refresh_token_key, provider._encrypt("stored-refresh")
        )
        mock_http.post.side_effect = RuntimeError("network down")

        with pytest.raises(SpotifyTokenError, match="Failed to renew access token"):
            await provider.get_token()


class TestPersistTokenTtl:
    async def test_boundary_ttl_clamped_to_one_when_expires_in_small(
        self, mock_http, fake_redis, fernet_key
    ):
        provider = make_provider(mock_http, fake_redis, fernet_key)
        token = SpotifyTokenProvider.Token(
            access_token="a", refresh_token="r", expires_in=30
        )

        await provider._persist_token(token)

        ttl = await fake_redis.ttl(provider._access_token_key)
        assert ttl == 1

    async def test_happy_path_ttl_set_when_expires_in_larger_than_buffer(
        self, mock_http, fake_redis, fernet_key
    ):
        provider = make_provider(mock_http, fake_redis, fernet_key)
        token = SpotifyTokenProvider.Token(
            access_token="a", refresh_token="r", expires_in=3600
        )

        await provider._persist_token(token)

        ttl = await fake_redis.ttl(provider._access_token_key)
        assert 0 < ttl <= 3540


class TestEncryptDecryptRoundtrip:
    def test_happy_path_roundtrip(self, mock_http, fake_redis, fernet_key):
        provider = make_provider(mock_http, fake_redis, fernet_key)

        encrypted = provider._encrypt("plaintext-value")
        assert provider._decrypt(encrypted) == "plaintext-value"
