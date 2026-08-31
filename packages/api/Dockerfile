FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.12.0 /uv /uvx /bin/

WORKDIR /app

RUN --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=packages,target=packages \
    uv sync --locked --no-cache --no-dev --no-editable --package api

COPY packages/api/src ./src
COPY packages/api/alembic ./alembic
COPY packages/api/alembic.ini ./alembic.ini

RUN useradd --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8080
CMD ["uv", "run", "--no-sync", "--no-cache", "python", "src/main.py"]
