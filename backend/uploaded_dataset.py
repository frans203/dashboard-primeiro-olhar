"""The uploaded CSV: one replaceable dataset held in memory.

The routes under ``/api`` always serve the bundled TSV — that never changes. This
module holds the *other* dataset: the CSV a user uploads at runtime, cleaned by the
same :mod:`cleaning` rules and served by the mirror routes under ``/api/uploads``.

There is a single slot: uploading again **replaces** it. Each replacement bumps
:attr:`UploadedDataset.version`, which is part of every cache key
(:data:`upload_cache`), so a new file can never read an aggregate computed from the
previous one.

Scope, deliberately: the slot is process-wide and unauthenticated, exactly like the
rest of the service (no database, no sessions) — everyone looking at the app sees the
last CSV uploaded. To make it per-user, turn ``_current`` into a dict keyed by an id
returned from the upload route and thread that id through the mirror routes; nothing
else in the design changes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import pandas as pd

from cache import AggregateCache
from cleaning import build_clean_df, missing_columns

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


_current: Optional[UploadedDataset] = None
_version = 0


def set_uploaded(raw: pd.DataFrame, filename: str) -> UploadedDataset:
    """Clean ``raw``, install it as the current dataset and drop the stale cache.

    Raises :class:`DatasetError` when required columns are missing or the file has no
    data rows.
    """
    global _current, _version

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
        warnings.append(
            f"{len(unnamed)} coluna(s) sem cabeçalho foram ignoradas."
        )
    if df["birthdate"].isna().all():
        warnings.append(
            "Nenhuma data de nascimento pôde ser lida — os gráficos por idade ficarão vazios."
        )

    _version += 1
    _current = UploadedDataset(
        df=df,
        filename=filename,
        row_count=int(len(df)),
        uploaded_at=datetime.now(timezone.utc),
        version=_version,
        warnings=warnings,
    )
    upload_cache.clear()
    return _current


def get_uploaded() -> Optional[UploadedDataset]:
    """The current uploaded dataset, or ``None`` if nothing was uploaded yet."""
    return _current


def clear_uploaded() -> None:
    """Forget the current dataset (and its aggregates)."""
    global _current
    _current = None
    upload_cache.clear()


def uploaded_cities() -> set[str]:
    """City labels present in the uploaded dataset (empty when there is none).

    ``city`` is validated against this set instead of the institute's known cities —
    the uploaded file has its own.
    """
    if _current is None:
        return set()
    return set(_current.df["city"].dropna().unique())
