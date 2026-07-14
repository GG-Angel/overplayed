import pytest
from unittest.mock import AsyncMock
from errors import SpotifyUserManagementError
from services.spotify import SpotifyUserManager


def make_manager(mock_http, fake_redis, mocker):
    tokens = mocker.Mock()
    tokens.get_token = AsyncMock(return_value="test-access-token")
    manager = SpotifyUserManager(
        http=mock_http,
        redis=fake_redis,
        tokens=tokens,
        app_client_id="app-client-id",
    )
    return manager, tokens


class TestAddUser:
    async def test_happy_path_activates_user(
        self,
        mock_http,
        fake_redis,
        mocker,
        make_async_cm,
        make_http_response,
        make_new_user,
        make_active_user,
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        active_user = make_active_user()
        mock_http.post.return_value = make_async_cm(
            make_http_response(json_data=active_user.model_dump(mode="json"))
        )

        result = await manager.add_user(make_new_user())

        assert result == active_user

    async def test_exception_activation_failure_wrapped(
        self, mock_http, fake_redis, mocker, make_new_user
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        mock_http.post.side_effect = RuntimeError("boom")

        with pytest.raises(SpotifyUserManagementError, match="Failed to add user"):
            await manager.add_user(make_new_user())


class TestRemoveUser:
    async def test_happy_path_deactivates_user(
        self,
        mock_http,
        fake_redis,
        mocker,
        make_async_cm,
        make_http_response,
        make_active_user,
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        mock_http.delete.return_value = make_async_cm(make_http_response())

        await manager.remove_user(make_active_user())  # should not raise

    async def test_exception_deactivation_failure_wrapped(
        self, mock_http, fake_redis, mocker, make_active_user
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        mock_http.delete.side_effect = RuntimeError("boom")

        with pytest.raises(SpotifyUserManagementError, match="Failed to remove user"):
            await manager.remove_user(make_active_user())


class TestHasUserAndGetUser:
    async def test_happy_path_has_user_true_when_present(
        self,
        mock_http,
        fake_redis,
        mocker,
        make_async_cm,
        make_http_response,
        make_active_user,
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        user = make_active_user(email="present@example.com")
        response = manager.GetUsersResponse(users=[user])
        mock_http.get.return_value = make_async_cm(
            make_http_response(json_data=response.model_dump(mode="json"))
        )

        assert await manager.has_user("present@example.com") is True
        assert await manager.has_user("absent@example.com") is False

    async def test_happy_path_get_user_returns_none_when_absent(
        self, mock_http, fake_redis, mocker, make_async_cm, make_http_response
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        response = manager.GetUsersResponse(users=[])
        mock_http.get.return_value = make_async_cm(
            make_http_response(json_data=response.model_dump(mode="json"))
        )

        assert await manager.get_user("missing@example.com") is None


class TestGetUsers:
    async def test_happy_path_cache_hit_skips_http_call(
        self, mock_http, fake_redis, mocker, make_active_user
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        user = make_active_user()
        cached = manager.GetUsersResponse(users=[user])
        await fake_redis.set(manager._users_key, cached.model_dump_json())

        users = await manager.get_users()

        assert users == [user]
        mock_http.get.assert_not_called()

    async def test_happy_path_cache_miss_fetches_and_caches(
        self,
        mock_http,
        fake_redis,
        mocker,
        make_async_cm,
        make_http_response,
        make_active_user,
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        user = make_active_user()
        response = manager.GetUsersResponse(users=[user])
        mock_http.get.return_value = make_async_cm(
            make_http_response(json_data=response.model_dump(mode="json"))
        )

        users = await manager.get_users()

        assert users == [user]
        assert await fake_redis.exists(manager._users_key)

    async def test_exception_fetch_failure_wrapped(
        self, mock_http, fake_redis, mocker
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        mock_http.get.side_effect = RuntimeError("boom")

        with pytest.raises(SpotifyUserManagementError, match="Failed to fetch active users"):
            await manager.get_users()


class TestCacheInvalidation:
    async def test_activate_user_invalidates_cache(
        self,
        mock_http,
        fake_redis,
        mocker,
        make_async_cm,
        make_http_response,
        make_new_user,
        make_active_user,
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        await fake_redis.set(manager._users_key, "stale-cache")
        mock_http.post.return_value = make_async_cm(
            make_http_response(json_data=make_active_user().model_dump(mode="json"))
        )

        await manager._activate_user(make_new_user())

        assert not await fake_redis.exists(manager._users_key)

    async def test_deactivate_user_invalidates_cache(
        self,
        mock_http,
        fake_redis,
        mocker,
        make_async_cm,
        make_http_response,
        make_active_user,
    ):
        manager, _ = make_manager(mock_http, fake_redis, mocker)
        await fake_redis.set(manager._users_key, "stale-cache")
        mock_http.delete.return_value = make_async_cm(make_http_response())

        await manager.deactivate_user(make_active_user())

        assert not await fake_redis.exists(manager._users_key)


class TestUrlAndHeaderBuilding:
    def test_happy_path_build_url_read_vs_write(self, mock_http, fake_redis, mocker):
        manager, _ = make_manager(mock_http, fake_redis, mocker)

        read_url = manager._build_url(write=False)
        write_url = manager._build_url(write=True)

        assert "app-client-id" in read_url
        assert read_url != write_url

    async def test_happy_path_build_headers_includes_token(
        self, mock_http, fake_redis, mocker
    ):
        manager, tokens = make_manager(mock_http, fake_redis, mocker)

        headers = await manager._build_headers()

        assert "Authorization" in headers
        assert "test-access-token" in headers["Authorization"]
        tokens.get_token.assert_awaited_once()
