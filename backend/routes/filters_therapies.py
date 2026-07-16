"""GET /api/filters/therapies — IMPLEMENTED.

Returns the normalized therapies vector (single source of truth from ``cleaning``) as
``{key, label}`` pairs. ``key`` is the english value the frontend echoes back as the
``therapy`` filter; ``label`` is the pt-BR display text.
"""

from fastapi import APIRouter

from cache import cached_no_params
from cleaning import therapies_vector
from dtos import KeyLabel, TherapiesFilterResponse

router = APIRouter(prefix="/api", tags=["filters"])


@cached_no_params
def _build() -> TherapiesFilterResponse:
    return TherapiesFilterResponse(
        therapies=[KeyLabel(key=t["key"], label=t["label"]) for t in therapies_vector()]
    )


@router.get("/filters/therapies", response_model=TherapiesFilterResponse)
def get_therapies_filter() -> TherapiesFilterResponse:
    return _build()
