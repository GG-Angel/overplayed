from services.queue import QueueRepository


class TestPush:
    async def test_happy_path_pushes_to_back_of_queue(self, fake_redis, make_new_user):
        repo = QueueRepository(fake_redis)

        result = await repo.push(make_new_user(name="Ada", email="ada@example.com"))

        assert result.position == 1
        dumped = await repo.dump()
        assert dumped.users[0].name == "Ada"
        assert dumped.users[0].email == "ada@example.com"
        assert dumped.users[0].retries == 0


class TestRetry:
    async def test_happy_path_pushes_to_front_of_queue(
        self, fake_redis, make_new_user, make_queued_user
    ):
        repo = QueueRepository(fake_redis)
        await repo.push(make_new_user(name="Existing", email="existing@example.com"))

        result = await repo.retry(
            make_queued_user(name="Retrying", email="retrying@example.com", retries=1)
        )

        assert result.position == 2
        dumped = await repo.dump()
        assert dumped.users[0].name == "Retrying"
        assert dumped.users[1].name == "Existing"


class TestPop:
    async def test_happy_path_pops_users_in_fifo_order(self, fake_redis, make_new_user):
        repo = QueueRepository(fake_redis)
        await repo.push(make_new_user(name="First", email="first@example.com"))
        await repo.push(make_new_user(name="Second", email="second@example.com"))

        result = await repo.pop(count=1)

        assert len(result.users) == 1
        assert result.users[0].name == "First"

    async def test_boundary_pop_from_empty_queue_returns_empty(self, fake_redis):
        repo = QueueRepository(fake_redis)

        result = await repo.pop(count=5)

        assert result.users == []


class TestDump:
    async def test_boundary_dump_empty_queue_returns_empty_list(self, fake_redis):
        repo = QueueRepository(fake_redis)

        result = await repo.dump()

        assert result.users == []


class TestGet:
    async def test_happy_path_returns_user_and_one_indexed_position(
        self, fake_redis, make_new_user
    ):
        repo = QueueRepository(fake_redis)
        await repo.push(make_new_user(name="First", email="first@example.com"))
        await repo.push(make_new_user(name="Second", email="second@example.com"))

        result = await repo.get("second@example.com")

        assert result is not None
        assert result.user.name == "Second"
        assert result.position == 2

    async def test_boundary_get_missing_user_returns_none(self, fake_redis):
        repo = QueueRepository(fake_redis)

        assert await repo.get("missing@example.com") is None


class TestHas:
    async def test_happy_path_true_when_present(self, fake_redis, make_new_user):
        repo = QueueRepository(fake_redis)
        await repo.push(make_new_user(email="present@example.com"))

        assert await repo.has("present@example.com") is True

    async def test_boundary_false_when_absent(self, fake_redis):
        repo = QueueRepository(fake_redis)

        assert await repo.has("absent@example.com") is False


class TestSize:
    async def test_boundary_zero_when_empty(self, fake_redis):
        repo = QueueRepository(fake_redis)

        assert await repo.size() == 0

    async def test_happy_path_reflects_number_of_entries(
        self, fake_redis, make_new_user
    ):
        repo = QueueRepository(fake_redis)
        await repo.push(make_new_user(email="one@example.com"))
        await repo.push(make_new_user(email="two@example.com"))

        assert await repo.size() == 2
