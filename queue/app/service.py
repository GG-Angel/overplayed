from fastapi import Depends
from queues.manager import QueueRepository
from spotify.users import SpotifyUserManagementClient, NewUser, User
from spotify.validate import SpotifyUserValidator
from state import State, get_state


class UserAlreadyInQueue(Exception):
    pass


class UserAlreadyActive(Exception):
    pass


class UserDoesNotExist(Exception):
    pass


class QueueService:
    def __init__(
        self,
        user_manager: SpotifyUserManagementClient,
        user_validator: SpotifyUserValidator,
        queue_manager: QueueRepository,
    ):
        self._user_manager = user_manager
        self._user_validator = user_validator
        self._queue_manager = queue_manager

    async def enqueue(self, user: NewUser) -> int:
        if await self._queue_manager.is_user_in_queue(user.email):
            raise UserAlreadyInQueue()
        if await self._user_manager.is_user_active(user.email):
            raise UserAlreadyActive()
        if not await self._user_validator.does_user_exist(user.email):
            raise UserDoesNotExist()
        return await self._queue_manager.enqueue(user)

    async def list_active_users(self) -> list[User]:
        return await self._user_manager.get_users()

    async def list_queued_users(self) -> list[NewUser]:
        return await self._queue_manager.get_users()


def get_queue(state: State = Depends(get_state)) -> QueueService:
    return QueueService(
        user_manager=state.users,
        user_validator=state.validator,
        queue_manager=state.queue,
    )
