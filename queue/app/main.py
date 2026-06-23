from pydantic import BaseModel
from loguru import logger
from aiohttp import ClientSession, ClientResponseError
from cryptography.fernet import Fernet
from redis.asyncio import Redis, ConnectionPool
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Response, status, Request, HTTPException
from state import State, get_state
from settings import APP_STATE_KEY, settings
from spotify.token import TokenManager
from spotify.validate import UserValidator
from spotify.users import UserManager, NewUser
from queues.manager import QueueManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    session = ClientSession()
    redis_pool = ConnectionPool.from_url(
        settings.redis_url, decode_responses=True, max_connections=10
    )
    try:
        redis = Redis(connection_pool=redis_pool)
        fernet = Fernet(settings.redis_key)
        validator = await UserValidator.create(session)
        auth = TokenManager(session, redis, fernet, settings.spotify_auth_client_id)
        users = UserManager(session, redis, auth, settings.spotify_app_client_id)
        queue = QueueManager(redis)

        try:
            await auth.seed_refresh_token(settings.spotify_refresh_token)
        except ClientResponseError:
            logger.critical(
                "Invalid Spotify refresh token or auth client id. Please renew."
            )
            raise

        app.state[APP_STATE_KEY] = State(
            validator=validator, auth=auth, users=users, queue=queue
        )
        yield
    finally:
        await session.close()
        await redis_pool.aclose()


app = FastAPI(lifespan=lifespan)


@app.get("/")
def handle_healthcheck():
    return ":o"


@app.get("/favicon.ico")
def handle_favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/queue")
async def get_queue(state: State = Depends(get_state)):
    return await state.users.get_users()


# @router.get("/queue")
# async def get_queue(
#     request: Request,
#     state: State = Depends(get_state),
# ) -> QueueDetails:
#     users = await state.users.get_users()
#     queue_size = await state.queue.get_size()
#     return QueueDetails(
#         active_users=len(users),
#         available_slots=max(0, USER_LIMIT - len(users)),
#         queue_size=queue_size,
#     )


class EnqueueUserResponse(BaseModel):
    position: int


@app.post("/queue")
async def enqueue_user(
    user: NewUser, state: State = Depends(get_state)
) -> EnqueueUserResponse:
    if await state.queue.is_user_in_queue(user.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already in queue",
        )

    if await state.users.is_user_active(user.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already active",
        )

    if not await state.validator.does_user_exist(user.email):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not exist",
        )

    position = await state.queue.enqueue(user)
    return EnqueueUserResponse(position=position)
