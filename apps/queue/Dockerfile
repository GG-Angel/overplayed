FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.0 /uv /uvx /bin/

WORKDIR /app

RUN --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=apps,target=apps \
    --mount=type=bind,source=libs,target=libs \
    uv sync --locked --no-cache --no-dev --no-editable --package queue

COPY apps/queue/app ./app

RUN useradd --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8080 9090
CMD ["uv", "run", "--no-sync", "--no-cache", "python", "-m", "app.main"]