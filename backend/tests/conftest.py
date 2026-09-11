from __future__ import annotations

import os

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from collections.abc import AsyncGenerator  # noqa: E402

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.deps import (  # noqa: E402
    get_db,
    get_llm_provider_dep,
    get_recipe_generation_provider_dep,
    get_speech_provider_dep,
    get_vision_provider_dep,
)
from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.models import *  # noqa: E402,F401,F403 - registers all tables on Base.metadata
from tests.fakes import (  # noqa: E402
    FakeLLMProvider,
    FakeRecipeGenerationProvider,
    FakeSpeechProvider,
    FakeVisionProvider,
)


@pytest_asyncio.fixture
async def engine() -> AsyncGenerator[AsyncEngine]:
    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine: AsyncEngine) -> AsyncGenerator[AsyncSession]:
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture
def fake_vision() -> FakeVisionProvider:
    return FakeVisionProvider()


@pytest.fixture
def fake_speech() -> FakeSpeechProvider:
    return FakeSpeechProvider()


@pytest.fixture
def fake_llm() -> FakeLLMProvider:
    return FakeLLMProvider()


@pytest.fixture
def fake_recipe_generation() -> FakeRecipeGenerationProvider:
    return FakeRecipeGenerationProvider()


@pytest_asyncio.fixture
async def client(
    engine: AsyncEngine,
    fake_vision: FakeVisionProvider,
    fake_speech: FakeSpeechProvider,
    fake_llm: FakeLLMProvider,
    fake_recipe_generation: FakeRecipeGenerationProvider,
) -> AsyncGenerator[AsyncClient]:
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_vision_provider_dep] = lambda: fake_vision
    app.dependency_overrides[get_speech_provider_dep] = lambda: fake_speech
    app.dependency_overrides[get_llm_provider_dep] = lambda: fake_llm
    app.dependency_overrides[get_recipe_generation_provider_dep] = lambda: fake_recipe_generation

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    email = "test.user@example.com"
    password = "supersecret123"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
