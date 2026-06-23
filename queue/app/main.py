from pydantic import BaseModel
from loguru import logger
from aiohttp import ClientSession, ClientResponseError
from cryptography.fernet import Fernet
from redis.asyncio import Redis, ConnectionPool
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Response, status, HTTPException
from state import State, get_state
from settings import APP_STATE_KEY, settings
from spotify.token import SpotifyTokenClient
from spotify.validate import UserValidator
from spotify.users import SpotifyUserManagementClient, NewUser
from queues.manager import QueueRepository
from cache import RedisCache
from service import (
    QueueService,
    get_queue,
    UserAlreadyActive,
    UserDoesNotExist,
    UserAlreadyInQueue,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    session = ClientSession()
    redis_pool = ConnectionPool.from_url(
        settings.redis_url, decode_responses=True, max_connections=10
    )
    try:
        redis = Redis(connection_pool=redis_pool)
        cache = RedisCache(redis=redis)
        fernet = Fernet(settings.redis_key)
        validator = await UserValidator.create(session)
        auth = SpotifyTokenClient(
            session, cache, fernet, settings.spotify_auth_client_id
        )
        users = SpotifyUserManagementClient(
            session, cache, auth, settings.spotify_app_client_id
        )
        queue = QueueRepository(redis)

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
    return ":p"


@app.get("/favicon.ico")
def handle_favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/queue")
async def view_queue(state: State = Depends(get_state)):
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
    # session est start time
    # session est end time


@app.post("/queue")
async def enqueue_user(
    user: NewUser,
    queue: QueueService = Depends(get_queue),
) -> EnqueueUserResponse:
    try:
        position = await queue.enqueue(user)
        return EnqueueUserResponse(position=position)
    except UserAlreadyActive:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already active"
        )
    except UserAlreadyInQueue:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already in queue"
        )
    except UserDoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist"
        )
