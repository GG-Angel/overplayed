from loguru import logger
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from settings import STATE_KEY
from routes import auth, root, user, playlists
from state import State


async def start(state: State):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with state:
            yield  # glues enter/exit signals to fastapi

    app = FastAPI(lifespan=lifespan)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception: {exc}")
        raise HTTPException(status_code=500, detail="Unexpected error.")

    app.state[STATE_KEY] = state

    app.include_router(root.router)
    app.include_router(auth.router, prefix="/auth", tags=["spotify", "auth"])
    app.include_router(user.router, prefix="/user", tags=["spotify", "user"])
    app.include_router(playlists.router, prefix="/playlists", tags=["spotify", "playlists"])  # fmt: skip

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    server = uvicorn.Server(config)
    await server.serve()
