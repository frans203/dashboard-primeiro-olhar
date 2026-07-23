"""FastAPI application entrypoint.

Reads the TSV into memory (via ``cleaning``), enables CORS (frontend and backend run
on different ports) and registers every route from ``routes``.

Two datasets are served: the bundled TSV under ``/api`` (fixed, never replaced) and
the CSV a user uploads, under ``/api/uploads`` (see ``uploaded_dataset``).

Run locally:  uvicorn main:app --reload --port 8000
"""

import os
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

# Origins allowed to call the API. Defaults to the Vite dev servers; in production set
# ALLOWED_ORIGINS to the deployed frontend URL(s), comma-separated — e.g.
#   ALLOWED_ORIGINS=https://primeiro-olhar.vercel.app
# Without it the browser blocks every request from the deployed frontend.
DEFAULT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    # POST/DELETE exist only for the uploaded-CSV slot (/api/uploads); every
    # analytics route is a GET.
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

for router in all_routers:
    app.include_router(router)


@app.get("/", tags=["meta"])
def root() -> dict:
    return {"service": "primeiro-olhar-dashboard", "status": "ok"}
