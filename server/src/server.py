import uvicorn
from state import State
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Response, status
from core.limiter import limiter
from core.config import APP_STATE_KEY
from routes import auth, users, playlists, previews, metrics


def build_app(state: State) -> FastAPI:
    app = FastAPI()

    app.state[APP_STATE_KEY] = state

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # ty:ignore[invalid-argument-type]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[state.settings.frontend_url],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/")
    def handle_healthcheck():
        return ":3"

    @app.get("/favicon.ico")
    def handle_favicon():
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
    app.include_router(previews.router, prefix="/previews", tags=["previews"])
    app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])

    return app


async def start(state: State):
    app = build_app(state)
    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    await uvicorn.Server(config).serve()
