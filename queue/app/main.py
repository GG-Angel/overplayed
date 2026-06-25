from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aiohttp import ClientSession
from cryptography.fernet import Fernet
from redis.asyncio import Redis, ConnectionPool
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Response, status, HTTPException
from state import State, get_state
from settings import APP_STATE_KEY, settings
from spotify.token import SpotifyTokenClient
from spotify.validate import SpotifyUserValidator
from spotify.users import SpotifyUserManagementClient, NewUser, USER_LIMIT
from queues.manager import QueueRepository
from cache import RedisCache
from worker import QueueWorker
from service import (
    QueueService,
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
        auth = SpotifyTokenClient(
            session=session,
            cache=cache,
            fernet=fernet,
            auth_client_id=settings.spotify_auth_client_id,
        )
        queue = QueueService(
            users=SpotifyUserManagementClient(
                session=session,
                cache=cache,
                auth=auth,
                client_id=settings.spotify_app_client_id,
            ),
            validator=await SpotifyUserValidator.create(session=session),
            queue=QueueRepository(redis=redis),
        )
        worker = QueueWorker(queue)

        # seed and validate credentials
        await auth.seed_refresh_token(settings.spotify_refresh_token)

        # start background queue worker
        worker.start()

        app.state[APP_STATE_KEY] = State(queue=queue)
        yield
    finally:
        await worker.stop()
        await session.close()
        await redis_pool.aclose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def handle_healthcheck():
    return ":o"


@app.get("/favicon.ico")
def handle_favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


class ViewQueueResponse(BaseModel):
    active_users: int
    queued_users: int
    user_limit: int


@app.get("/queue")
async def view_queue(state: State = Depends(get_state)) -> ViewQueueResponse:
    active = await state.queue.list_active_users()
    queued = await state.queue.list_queued_users()
    return ViewQueueResponse(
        active_users=len(active),
        queued_users=len(queued),
        user_limit=USER_LIMIT,
    )


class EnqueueUserResponse(BaseModel):
    position: int | None
    admitted: bool
    start_time: datetime
    end_time: datetime


@app.post("/queue")
async def enqueue_user(
    user: NewUser,
    state: State = Depends(get_state),
) -> EnqueueUserResponse:
    try:
        result = await state.queue.enqueue(user)
        return EnqueueUserResponse(
            position=result.position,
            admitted=result.admitted,
            start_time=result.start_time,
            end_time=result.end_time,
        )
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
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to queue user",
        )
