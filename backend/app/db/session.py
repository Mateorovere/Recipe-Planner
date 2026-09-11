"""Async SQLAlchemy engine/session factory for the running app.

Tests use their own separate in-memory engine (see `tests/conftest.py`) rather
than this module, so these stay simple, argument-free cached singletons bound to
`Settings.database_url`.
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
def get_engine() -> AsyncEngine:
    url = get_settings().database_url
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    return create_async_engine(url, pool_pre_ping=True, connect_args=connect_args)


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(bind=get_engine(), expire_on_commit=False, autoflush=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        yield session
