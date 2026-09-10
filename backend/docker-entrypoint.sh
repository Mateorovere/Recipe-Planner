#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for the database to be ready..."
python - <<'PYEOF'
import asyncio
import sys
import time

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings


async def wait() -> None:
    engine = create_async_engine(get_settings().database_url)
    deadline = time.monotonic() + 60
    while True:
        try:
            async with engine.connect() as conn:
                await conn.run_sync(lambda _: None)
            return
        except Exception as exc:  # noqa: BLE001
            if time.monotonic() > deadline:
                print(f"Database never became ready: {exc}", file=sys.stderr)
                raise
            await asyncio.sleep(1)


asyncio.run(wait())
PYEOF

echo "Running database migrations..."
alembic upgrade head

echo "Seeding database (idempotent)..."
python -m app.db.seed

echo "Starting application..."
exec "$@"
