"""FastAPI application entrypoint.

Reads the TSV into memory (via ``cleaning``), enables CORS (frontend and backend run
on different ports) and registers every route from ``routes``.

Two datasets are served: the bundled TSV under ``/api`` (fixed, never replaced) and
the CSV a user uploads, under ``/api/uploads`` (see ``uploaded_dataset``).

Run locally:  uvicorn main:app --reload --port 8000
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Local convenience: read backend/.env when present. On a host the real environment
# already carries the variables and nothing is overwritten.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

import blob_storage  # noqa: E402
from cleaning import DatasetUnavailable, get_clean_df  # noqa: E402 - after load_dotenv
from routes import all_routers  # noqa: E402

log = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm the cache so the first request is fast — but NEVER let it take the service
    # down. A missing/misconfigured institute file must degrade into a 503 with an
    # explanation on /api/*, while /api/uploads/* keeps working; killing the process
    # here would turn a configuration mistake into an opaque crash loop.
    if blob_storage.on_vercel() and not blob_storage.enabled():
        log.warning(
            "Sem token do Blob nesta função: o CSV enviado não sobreviveria entre "
            "instâncias. Conecte o Blob store ao projeto e refaça o deploy."
        )
    try:
        get_clean_df()
    except Exception as exc:  # noqa: BLE001 - startup must survive any load failure
        log.warning("Dataset do Instituto indisponível no startup: %s", exc)
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

@app.exception_handler(DatasetUnavailable)
@app.exception_handler(blob_storage.BlobUnavailable)
async def _storage_unavailable(request: Request, exc: Exception) -> JSONResponse:
    """Configuration/storage problems answer 503 with the actionable message."""
    log.error("Armazenamento indisponível em %s: %s", request.url.path, exc)
    return JSONResponse(status_code=503, content={"detail": str(exc)})


for router in all_routers:
    app.include_router(router)


@app.get("/", tags=["meta"])
def root() -> dict:
    return {"service": "primeiro-olhar-dashboard", "status": "ok"}
