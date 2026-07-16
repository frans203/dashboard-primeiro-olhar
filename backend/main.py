"""FastAPI application entrypoint.

Reads the TSV into memory (via ``cleaning``), enables CORS (frontend and backend run
on different ports) and registers every route from ``routes``.

Run locally:  uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cleaning import get_clean_df
from routes import all_routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load + clean the dataset once at startup so the first request is fast.
    get_clean_df()
    yield


app = FastAPI(
    title="Instituto Primeiro Olhar — Dashboard API",
    description="Aggregates and crossings over the T21 children dataset (no database).",
    version="0.1.0",
    lifespan=lifespan,
)

# Frontend dev servers (Vite default 5173). Adjust for production origins.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

for router in all_routers:
    app.include_router(router)


@app.get("/", tags=["meta"])
def root() -> dict:
    return {"service": "primeiro-olhar-dashboard", "status": "ok"}
