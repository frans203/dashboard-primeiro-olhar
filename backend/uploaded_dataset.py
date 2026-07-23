"""The uploaded CSV: one replaceable dataset, in memory or in Blob.

The routes under ``/api`` always serve the institute's file — that never changes. This
module holds the *other* dataset: the CSV a user uploads at runtime, cleaned by the same
:mod:`cleaning` rules and served by the mirror routes under ``/api/uploads``.

Two storage backends, chosen at call time by :func:`blob_storage.enabled`:

* **In memory** (no Blob token) — a single process-wide slot. Local development and the
  test suite, and any host that runs one long-lived process.
* **Vercel Blob** (token present) — required on serverless, where the next request may
  hit a different copy of the app that never saw the upload. Each upload is written
  under a **unique** pathname (never overwritten, so the CDN never serves a stale
  version) and "the current dataset" is simply the most recent blob. Cleaning its bytes
  costs ~50 ms and each copy of the app memoizes the result per pathname.

Either way the semantics the UI sees are the same: uploading **replaces** the dataset,
and the version bump invalidates every cached aggregate (:data:`upload_cache`).

Scope, deliberately: one dataset for everyone, unauthenticated, exactly like the rest of
the service. Two people uploading at once overwrite each other's view. To make it
per-user, key the pathname by a session id handed to the browser and thread it through
the mirror routes; nothing else in the design changes.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import pandas as pd

import blob_storage
from cache import AggregateCache
from cleaning import build_clean_df, missing_columns, read_tabular

#: Aggregates over the uploaded dataset. Separate from ``cache.aggregate_cache`` (the
#: institute's), and keyed with the dataset version so a replacement invalidates.
upload_cache = AggregateCache()


class DatasetError(ValueError):
    """The uploaded file cannot become a dataset (bad columns, unreadable, empty)."""


@dataclass(frozen=True)
class UploadedDataset:
    """A cleaned upload plus the metadata the UI shows above the charts."""

    df: pd.DataFrame
    filename: str
    row_count: int
    uploaded_at: datetime
    version: int
    warnings: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------- #
# Cleaning (shared by both backends)
# --------------------------------------------------------------------------- #


def _clean(content: bytes, filename: str) -> tuple[pd.DataFrame, list[str]]:
    """Parse + clean uploaded bytes, or raise :class:`DatasetError`."""
    try:
        raw = read_tabular(content, filename)
    except ValueError as exc:
        raise DatasetError(str(exc)) from exc

    missing = missing_columns(raw)
    if missing:
        raise DatasetError(
            "O arquivo não tem as colunas obrigatórias: " + ", ".join(missing)
        )
    if raw.empty:
        raise DatasetError("O arquivo não tem nenhuma linha de dados.")

    df = build_clean_df(raw)

    warnings: list[str] = []
    unnamed = [c for c in raw.columns if str(c).startswith("Unnamed:")]
    if unnamed:
        warnings.append(f"{len(unnamed)} coluna(s) sem cabeçalho foram ignoradas.")
    if df["birthdate"].isna().all():
        warnings.append(
            "Nenhuma data de nascimento pôde ser lida — os gráficos por idade ficarão vazios."
        )
    return df, warnings


# --------------------------------------------------------------------------- #
# In-memory backend
# --------------------------------------------------------------------------- #

_current: Optional[UploadedDataset] = None
_version = 0


# --------------------------------------------------------------------------- #
# Blob backend
# --------------------------------------------------------------------------- #

#: pathname -> cleaned dataset, per process. Pathnames are unique per upload, so an
#: entry can never be stale.
_blob_cache: dict[str, UploadedDataset] = {}

_UNSAFE_IN_PATHNAME = re.compile(r"[^A-Za-z0-9._-]+")


def _blob_pathname(filename: str) -> str:
    """``uploads/<uuid>__<filename>`` — unique, and keeps the original name readable."""
    safe = _UNSAFE_IN_PATHNAME.sub("_", filename).strip("_") or "arquivo.csv"
    return f"{blob_storage.UPLOADS_PREFIX}{uuid.uuid4().hex[:12]}__{safe}"


def _filename_from_pathname(pathname: str) -> str:
    tail = pathname.rsplit("/", 1)[-1]
    _, _, name = tail.partition("__")
    return name or tail


def _version_from(uploaded_at: datetime) -> int:
    """Milliseconds since the epoch — monotonic, and the same in every copy of the app
    because it comes from the store, not from the local clock."""
    return int(uploaded_at.timestamp() * 1000)


def _dataset_from_blob(pathname: str, uploaded_at: datetime) -> UploadedDataset:
    cached = _blob_cache.get(pathname)
    if cached is not None:
        return cached

    filename = _filename_from_pathname(pathname)
    df, warnings = _clean(blob_storage.read(pathname), filename)
    dataset = UploadedDataset(
        df=df,
        filename=filename,
        row_count=int(len(df)),
        uploaded_at=uploaded_at,
        version=_version_from(uploaded_at),
        warnings=warnings,
    )
    _blob_cache[pathname] = dataset
    return dataset


# --------------------------------------------------------------------------- #
# Public API (backend-agnostic)
# --------------------------------------------------------------------------- #


def set_uploaded(content: bytes, filename: str) -> UploadedDataset:
    """Clean ``content``, install it as the current dataset and drop the stale cache.

    Raises :class:`DatasetError` when the file is unreadable, has no data rows or is
    missing required columns — the message is shown to the user as-is.
    """
    global _current, _version

    # Clean BEFORE storing: a bad file must be rejected, not persisted.
    df, warnings = _clean(content, filename)
    upload_cache.clear()

    if blob_storage.enabled():
        pathname = blob_storage.write(_blob_pathname(filename), content)
        uploaded_at = _uploaded_at_of(pathname)
        dataset = UploadedDataset(
            df=df,
            filename=_filename_from_pathname(pathname),
            row_count=int(len(df)),
            uploaded_at=uploaded_at,
            version=_version_from(uploaded_at),
            warnings=warnings,
        )
        # Cache it here too: the writer must not pay for reading its own upload back,
        # and listing right after a write can lag by a moment.
        _blob_cache[pathname] = dataset
        return dataset

    _version += 1
    _current = UploadedDataset(
        df=df,
        filename=filename,
        row_count=int(len(df)),
        uploaded_at=datetime.now(timezone.utc),
        version=_version,
        warnings=warnings,
    )
    return _current


def _uploaded_at_of(pathname: str) -> datetime:
    """The store's own timestamp for a blob — the source of truth for the version.

    Falls back to the local clock if the store does not report one, which only costs a
    slightly different version number.
    """
    import vercel.blob as blob

    try:
        head = blob.head(pathname)
        if head.uploaded_at is not None:
            return head.uploaded_at
    except Exception:  # noqa: BLE001 - metadata is a nicety, never a failure
        pass
    return datetime.now(timezone.utc)


def get_uploaded() -> Optional[UploadedDataset]:
    """The current uploaded dataset, or ``None`` if nothing was uploaded yet."""
    if not blob_storage.enabled():
        return _current

    items = blob_storage.list_uploads()
    if not items:
        return None
    newest = items[0]
    return _dataset_from_blob(newest.pathname, newest.uploaded_at)


def clear_uploaded() -> None:
    """Forget the current dataset (and its aggregates)."""
    global _current
    _current = None
    upload_cache.clear()

    if blob_storage.enabled():
        pathnames = [item.pathname for item in blob_storage.list_uploads()]
        blob_storage.delete(pathnames)
        _blob_cache.clear()


def uploaded_cities() -> set[str]:
    """City labels present in the uploaded dataset (empty when there is none).

    ``city`` is validated against this set instead of the institute's known cities —
    the uploaded file has its own.
    """
    dataset = get_uploaded()
    if dataset is None:
        return set()
    return set(dataset.df["city"].dropna().unique())
