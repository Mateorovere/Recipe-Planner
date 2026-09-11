# 🍳 AI Recipe Planner

A full-stack app that figures out what you can cook from a photo, a voice note, or a
typed list of ingredients (with quantities) — then has an LLM generate real, complete
recipes tailored to exactly what's on hand, with nutrition info, substitutions, and a
"why this matches" explanation. Every generated recipe is persisted, so it has a
stable detail page and can be favorited and revisited.

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Local setup without Docker](#local-setup-without-docker)
- [Environment variables](#environment-variables)
- [Database & migrations](#database--migrations)
- [Running tests](#running-tests)
- [Linting, formatting, type-checking](#linting-formatting-type-checking)
- [Pre-commit hooks](#pre-commit-hooks)
- [AI provider configuration](#ai-provider-configuration)
- [API documentation](#api-documentation)
- [Project structure](#project-structure)
- [CI/CD](#cicd)
- [Future GCP deployment](#future-gcp-deployment)

## Overview

The core flow: the user provides ingredients (with optional quantities/units) via
**photo**, **voice**, or **text** → the backend uses a swappable AI layer to extract
structured ingredients → the user reviews/edits them (including quantities) → the
backend sends that list to an LLM, which **generates** a batch of complete recipes
built specifically around what the user has → each generated recipe (steps,
ingredients, nutrition, substitutions, a "why it matches" explanation) is
**persisted immediately**, so it gets a real, stable id → results are shown ranked by
how much of the user's own ingredient list each recipe actually uses → the user can
drill into a full recipe and save it as a favorite, and it'll be exactly the same
recipe next time (not regenerated).

Recipes are never looked up from a fixed catalog — there's no hand-curated recipe
database to search. All nutrition is AI-estimated (since every recipe is freshly
generated) and clearly labeled as such in the UI, never presented as medically
precise. Ingredient *detection* confidence is still surfaced to the user so
low-confidence guesses can be corrected before they're used.



**Recipe generation pipeline** (`backend/app/services/recipe_service.py`):

```
ingredients + quantities/units (from the review screen)
        │  normalize names (exact → alias → fuzzy match against the
        │  ingredients dictionary, for consistent canonical naming)
        ▼
RecipeGenerationProvider.generate_recipes(...)
        │  one AI call returns N complete recipes: ingredients (marked
        │  user_has true/false), steps, nutrition, tags, substitutions,
        │  and a per-recipe match explanation — no DB lookup involved
        ▼
persist each recipe
        │  creates Recipe + RecipeStep + RecipeIngredient (creating any
        │  new canonical Ingredient rows on the fly) + NutritionInformation
        │  rows, so every recipe gets a real, stable, favoritable id
        ▼
ranked-by-match RecipeSummary list
```

There's no algorithmic fallback here — generation *is* the feature, so if the AI
provider fails the request surfaces a clean `502 ai_provider_error` rather than
silently degrading to something else.

**AI provider abstraction** (`backend/app/ai/`): every AI capability is an ABC —
`VisionProvider`, `SpeechProvider`, `LLMProvider`, `RecipeGenerationProvider` — built
by `ai/factory.py` from environment variables. Swapping a provider (e.g. Anthropic
instead of OpenAI, or a cloud STT instead of local Whisper) means adding one new
class and changing an env var; nothing in `services/` or `api/` changes. API keys
live only in the backend; the frontend never sees them.

## Tech stack

| Layer         | Choice                                                                 |
| ------------- | ----------------------------------------------------------------------|
| Frontend      | React 18, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack Query, Zustand |
| Backend       | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), Alembic     |
| Database      | PostgreSQL 16                                                          |
| AI (default)  | OpenAI (vision + LLM extraction + recipe generation/nutrition), local `faster-whisper` (speech-to-text) |
| Auth          | JWT (python-jose) + bcrypt (passlib)                                   |
| Dev tooling   | `uv`, Ruff, MyPy, Pytest, ESLint, Prettier, Vitest, pre-commit          |
| Infra         | Docker, Docker Compose, Dev Containers, GitHub Actions                 |

## Prerequisites

- [Docker](https://www.docker.com/) + Docker Compose (recommended path), **or**
- Python 3.12 + [`uv`](https://docs.astral.sh/uv/) and Node.js 20+ (for running
  without Docker)
- An [OpenAI API key](https://platform.openai.com/account/api-keys) (used for
  vision/text/audio ingredient extraction and recipe generation — see
  [AI provider configuration](#ai-provider-configuration) to swap providers).
  Recipe generation itself is AI-dependent end to end, so this key is required
  for the app's core flow to work, unlike a catalog-backed app.

## Quick start (Docker)

```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY and SECRET_KEY at minimum

docker compose up
```

This starts PostgreSQL, the backend (which automatically waits for the database,
runs Alembic migrations, and seeds a starter ingredient dictionary on first boot),
and the frontend dev server:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8000> (interactive docs at `/docs`)
- Postgres: `localhost:5432`

A valid `OPENAI_API_KEY` is required for the core flow (ingredient detection and
recipe generation are both AI-dependent) — without one, requests fail with a clean
`502 ai_provider_error` rather than a stack trace. Auth, favorites, and history
work regardless once you have at least one generated recipe to work with.

## Local setup without Docker

**Database** — run Postgres yourself (or reuse the Docker one: `docker compose up
db`), then set `DATABASE_URL` accordingly.

**Backend:**

```bash
cd backend
pip install uv        # if you don't already have uv
cp ../.env.example .env   # or hand-write backend/.env — see below
uv sync --dev
uv run alembic upgrade head
uv run python -m app.db.seed
uv run uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment variables

All configuration is via environment variables — see [`.env.example`](.env.example)
at the repo root for the full list with comments (Docker Compose reads it
directly). The backend validates required variables **at startup** and fails with
a clear error message if something's missing, rather than failing confusingly on
the first request.

Key variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Async SQLAlchemy URL, e.g. `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Signs JWTs — generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `VISION_PROVIDER` / `LLM_PROVIDER` / `SPEECH_PROVIDER` / `RECIPE_GENERATION_PROVIDER` | Which AI implementation each capability uses (see below) |
| `OPENAI_API_KEY` | Required while any provider above is `openai` |
| `RECIPES_PER_SEARCH` | Default number of recipes generated per search |
| `VITE_API_BASE_URL` | Frontend → backend base URL |

Never commit `.env` — it's git-ignored; only `.env.example` (with placeholder
values) is tracked.

## Database & migrations

Schema (see `backend/app/models/`): `users`, `ingredients`, `ingredient_aliases`,
`recipes`, `recipe_steps`, `recipe_tags`, `recipe_ingredients`,
`nutrition_information`, `user_ingredients`, `saved_recipes`, `recipe_searches` —
with foreign keys, indexes, unique constraints, and timestamps throughout.
`ingredients` is a normalization dictionary that grows at runtime: any ingredient
name an AI-generated recipe introduces gets upserted into it automatically.
`recipes` and its children are populated exclusively by persisting AI-generated
output at search time — there is no seeded recipe catalog to query against.

Migrations live in `backend/alembic/` (kept next to the app it introspects, rather
than a separate top-level `database/` folder — the cleanest layout for Alembic's
autogenerate to import the SQLAlchemy models):

```bash
cd backend
uv run alembic revision --autogenerate -m "describe the change"
uv run alembic upgrade head
uv run alembic downgrade -1   # roll back one revision
```

Seeding (idempotent — safe to re-run) populates the starter ingredient dictionary
(`backend/app/db/seed_data.py`) used for normalizing/matching input; it does not
seed any recipes:

```bash
uv run python -m app.db.seed
```

## Running tests

**Backend** (mocked AI providers — no real API calls are made in tests):

```bash
cd backend
uv run pytest              # unit + API tests against an in-memory SQLite DB
uv run pytest --cov=app    # with coverage
```

**Frontend:**

```bash
cd frontend
npm run test         # component tests + a full text→review→results flow test
```

CI additionally runs the Alembic migrations against a real Postgres service
container to catch anything SQLite's looser typing would hide (see
[CI/CD](#cicd)).

## Linting, formatting, type-checking

```bash
# Backend
cd backend
uv run ruff check app tests      # lint
uv run ruff format app tests     # format
uv run mypy app                  # strict type-checking

# Frontend
cd frontend
npm run lint          # ESLint
npm run format        # Prettier (writes)
npm run format:check  # Prettier (check only, used in CI)
npm run typecheck     # tsc --noEmit, strict mode
```

## Pre-commit hooks

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files   # run once against everything
```

`.pre-commit-config.yaml` runs Ruff (format + lint), MyPy, and Pytest for the
backend and ESLint, Prettier, and `tsc` for the frontend — via `uv run`/`npm run`
so it always uses the exact versions pinned in `uv.lock`/`package-lock.json`,
plus standard hygiene hooks (trailing whitespace, large files, merge conflicts,
private keys).

## AI provider configuration

Every AI capability is defined as an abstract interface with a factory that picks
the implementation from env vars (`backend/app/ai/`):

```
AIProvider
 ├── VisionProvider           (image -> ingredients)          — openai (default)
 ├── SpeechProvider           (audio -> transcript)            — local_whisper (default) | openai
 ├── LLMProvider              (text -> ingredients)             — openai (default)
 └── RecipeGenerationProvider (ingredients -> recipes+nutrition) — openai (default)
```

To add a new provider (e.g. Anthropic for vision/LLM): implement the relevant ABC
in `backend/app/ai/providers/`, register it in `backend/app/ai/factory.py`, add the
new option to the `Literal` types in `backend/app/core/config.py`, and set the env
var. Nothing in `services/` or `api/` needs to change — they depend only on the
interfaces.

`SPEECH_PROVIDER=local_whisper` runs [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
inside the backend container — no extra API key, no per-request cost, works
offline. Switch to `SPEECH_PROVIDER=openai` for cloud transcription instead.

## API documentation

Interactive docs (Swagger UI): `http://localhost:8000/docs` — generated from the
Pydantic schemas, always in sync with the code. Base path: `/api/v1`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/ingredients/image` | optional | Detect ingredients from an uploaded photo |
| POST | `/ingredients/audio` | optional | Transcribe audio and extract ingredients |
| POST | `/ingredients/text` | optional | Extract ingredients from free text |
| POST | `/recipes/search` | optional | Generate & persist recipes from an ingredient (+ quantity) list |
| GET | `/recipes/{recipe_id}` | optional | Full detail of a previously generated, persisted recipe |
| POST | `/recipes/{recipe_id}/favorite` | required | Save a recipe |
| DELETE | `/recipes/{recipe_id}/favorite` | required | Remove a favorite |
| POST | `/auth/register` | — | Create an account |
| POST | `/auth/login` | — | Get a JWT |
| GET | `/users/me` | required | Current user profile |
| GET | `/users/me/favorites` | required | Saved recipes |
| GET | `/users/me/history` | required | Search + ingredient history |

"optional" auth means the endpoint works for guests but records history when a
valid `Authorization: Bearer <token>` is sent.

Example requests:

```bash
# Extract ingredients from text
curl -X POST http://localhost:8000/api/v1/ingredients/text \
  -H "Content-Type: application/json" \
  -d '{"text": "I have chicken, rice, broccoli and soy sauce."}'

# Generate recipes from ingredients (with quantities)
curl -X POST http://localhost:8000/api/v1/recipes/search \
  -H "Content-Type: application/json" \
  -d '{
        "ingredients": [
          {"name": "egg", "quantity": 2, "unit": "unit"},
          {"name": "tomato", "quantity": 1, "unit": "unit"},
          {"name": "cheddar cheese", "quantity": 50, "unit": "g"}
        ],
        "count": 5
      }'

# Register + log in
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "a-strong-password"}'

curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "a-strong-password"}'
# => {"access_token": "...", "token_type": "bearer"}

# Favorite a recipe
curl -X POST http://localhost:8000/api/v1/recipes/1/favorite \
  -H "Authorization: Bearer <token>"
```

Errors are always structured JSON, never a raw stack trace:

```json
{ "error": { "code": "ai_provider_error", "message": "The AI provider returned an error: ..." } }
```

## Project structure

```
recipe-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/       # routers (thin) + deps.py (DI wiring)
│   │   ├── core/         # config, security, exceptions, logging
│   │   ├── db/           # engine/session, seed data + seed script
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── repositories/ # data access (one per aggregate)
│   │   ├── services/     # business logic incl. the recipe generation pipeline
│   │   └── ai/           # provider interfaces, OpenAI/Whisper implementations, factory
│   ├── alembic/          # migrations
│   ├── tests/            # pytest, mocked AI providers, SQLite
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # typed fetch client
│   │   ├── components/   # layout, input, ingredients, recipes, auth, common
│   │   ├── hooks/         # TanStack Query hooks
│   │   ├── pages/         # one component per route
│   │   ├── state/         # Zustand stores (auth, ingredient draft)
│   │   └── types/         # TS types mirroring backend schemas
│   └── Dockerfile
├── .devcontainer/          # backend + frontend Dev Container configs
├── .github/workflows/      # ci.yml, gcp-deploy.yml (template)
├── docker-compose.yml
├── .env.example
└── .pre-commit-config.yaml
```

## CI/CD

`.github/workflows/ci.yml` runs on every push to `main` and every pull request —
backend lint (Ruff + MyPy), backend tests (Pytest on SQLite), a Postgres-backed
job that applies/rolls back the Alembic migration for real, frontend lint
(ESLint + Prettier), frontend type-check (`tsc`), frontend tests (Vitest), and a
frontend production build. None of it requires external credentials.

`.github/workflows/gcp-deploy.yml` is a **template**, triggered only manually
(`workflow_dispatch`) — see [Future GCP deployment](#future-gcp-deployment).

## Future GCP deployment

The repo is structured for, but not currently deployed to, GCP. When ready:

1. **Artifact Registry** — Docker repo for the backend and frontend images
   (`frontend/Dockerfile`'s `production` stage serves the built static app via
   nginx; `backend/Dockerfile` runs the FastAPI app under Uvicorn).
2. **Cloud SQL for PostgreSQL** — replace the local `db` container; connect via
   the Cloud SQL Auth Proxy / Unix socket in `DATABASE_URL`.
3. **Secret Manager** — store `SECRET_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`
   there instead of plain env vars in production.
4. **Cloud Run** — stateless services for both the backend and the frontend.

`.github/workflows/gcp-deploy.yml` already encodes this shape (build → push to
Artifact Registry → deploy to Cloud Run, secrets pulled from Secret Manager,
Cloud SQL attached via `--add-cloudsql-instances`) behind `workflow_dispatch` and
a configuration check, so it's inert until you add the `GCP_*` repository
variables/secrets it documents — **it will not deploy anything on its own.**
