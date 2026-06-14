FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --locked

COPY . .

# Run as an unprivileged user
RUN useradd --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8080
CMD ["uv", "run", "python", "src/main.py"]