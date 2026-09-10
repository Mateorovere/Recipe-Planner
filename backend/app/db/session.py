"""Async SQLAlchemy engine/session factory.

`get_engine`/`get_sessionmaker` are cached on the settings' `database_url` so tests
can point at an isolated SQLite database (see `tests/conftest.py`) while the running
app uses Postgres, without any global mutable state.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings


@lru_cache
def get_engine(database_url: str | None = None) -> AsyncEngine:
    url = database_url or get_settings().database_url
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    return create_async_engine(url, pool_pre_ping=True, connect_args=connect_args)


@lru_cache
def get_sessionmaker(database_url: str | None = None) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=get_engine(database_url), expire_on_commit=False, autoflush=False
    )


async def get_db() -> AsyncGenerator[AsyncSession]:
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        yield session
