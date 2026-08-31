FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.12.0 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-cache --no-dev

COPY src ./src
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

RUN useradd --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8080
CMD ["uv", "run", "--no-sync", "--no-cache", "python", "src/main.py"]
