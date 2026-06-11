import uvicorn
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter
from fastapi.middleware.cors import CORSMiddleware
from core.config import Settings
from fastapi import FastAPI, Response, status


async def start(settings: Settings):
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # ty:ignore[invalid-argument-type]

    @app.get("/")
    def handle_healthcheck():
        return ":3"

    @app.get("/favicon.ico")
    def handle_favicon():
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    server = uvicorn.Server(config)
    await server.serve()
