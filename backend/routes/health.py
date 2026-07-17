"""GET /api/health.

Filters: city, ageMin, ageMax, sex, incomeMin, incomeMax.
Response: HealthResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, health
from cache import aggregate_cache, make_key
from dtos import HealthQuery, HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health(q: Annotated[HealthQuery, Query()]) -> HealthResponse:
    key = make_key(
        "health",
        {
            "city": q.city,
            "ageMin": q.ageMin,
            "ageMax": q.ageMax,
            "sex": q.sex,
            "incomeMin": q.incomeMin,
            "incomeMax": q.incomeMax,
        },
    )

    def compute() -> HealthResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            sex=q.sex.value if q.sex else None,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
        )
        return HealthResponse(**health(df))

    return aggregate_cache.get_or_compute(key, compute)
