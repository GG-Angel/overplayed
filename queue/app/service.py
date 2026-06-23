from fastapi import Depends
from queues.manager import QueueManager
from spotify.users import UserManager, NewUser
from spotify.validate import UserValidator
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
        user_manager: UserManager,
        user_validator: UserValidator,
        queue_manager: QueueManager,
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


def get_queue_service(state: State = Depends(get_state)) -> QueueService:
    return QueueService(
        user_manager=state.users,
        user_validator=state.validator,
        queue_manager=state.queue,
    )
