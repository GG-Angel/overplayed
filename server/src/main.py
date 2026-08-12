import uvicorn
import asyncio
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from server import build_app


async def main():
    app = build_app()
    metrics_app = FastAPI()

    Instrumentator().instrument(app).expose(metrics_app)

    configs = [
        uvicorn.Config(
            app,
            host="0.0.0.0",
            port=8080,
            proxy_headers=True,
            forwarded_allow_ips="*",
        ),
        uvicorn.Config(
            metrics_app,
            host="0.0.0.0",
            port=9090,
            log_level="warning",
        ),
    ]

    await asyncio.wait(
        [asyncio.create_task(uvicorn.Server(config).serve()) for config in configs],
        return_when=asyncio.FIRST_COMPLETED,
    )


if __name__ == "__main__":
    asyncio.run(main())
