import uvicorn
from limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from settings import STATE_KEY
from state import State
from routes import auth, home, users, playlists, previews


async def start(state: State):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with state:
            yield  # glues enter/exit signals to fastapi

    app = FastAPI(lifespan=lifespan)

    app.state[STATE_KEY] = state

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[state.settings.frontend_url],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception: {exc}")
        return JSONResponse(status_code=500, content={"detail": "Unexpected error."})

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # ty:ignore[invalid-argument-type]

    app.include_router(home.router)
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
    app.include_router(previews.router, prefix="/previews", tags=["previews"])

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    server = uvicorn.Server(config)
    await server.serve()
