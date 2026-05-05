from fastapi.responses import JSONResponse
from loguru import logger
import uvicorn
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

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception: {exc}")
        return JSONResponse(status_code=500, content={"detail": "Unexpected error."})

    app.state[STATE_KEY] = state

    app.include_router(home.router)
    app.include_router(auth.router, prefix="/auth", tags=["spotify", "auth"])  # fmt: skip
    app.include_router(users.router, prefix="/users", tags=["spotify", "users"])  # fmt: skip
    app.include_router(playlists.router, prefix="/playlists", tags=["spotify", "playlists"])  # fmt: skip
    app.include_router(previews.router, prefix="/previews", tags=["spotify", "previews"])  # fmt: skip

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    server = uvicorn.Server(config)
    await server.serve()
