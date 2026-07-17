"""GET /api/therapies.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, parentEducation, benefit.
Do NOT filter by ``therapy`` — it is the axis here.

NOTE: distinct from /api/filters/therapies (the filter-options list).
This route returns the therapy access *rate* and the *top therapies* aggregate.
Response: TherapiesResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, therapies
from cache import aggregate_cache, make_key
from dtos import TherapiesQuery, TherapiesResponse

router = APIRouter(prefix="/api", tags=["therapies"])


@router.get("/therapies", response_model=TherapiesResponse)
def get_therapies(q: Annotated[TherapiesQuery, Query()]) -> TherapiesResponse:
    key = make_key(
        "therapies",
        {
            "city": q.city,
            "ageMin": q.ageMin,
            "ageMax": q.ageMax,
            "incomeMin": q.incomeMin,
            "incomeMax": q.incomeMax,
            "parentEducation": q.parentEducation,
            "benefit": q.benefit,
        },
    )

    def compute() -> TherapiesResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
            parentEducation=q.parentEducation.value if q.parentEducation else None,
            benefit=q.benefit.value if q.benefit else None,
        )
        return TherapiesResponse(**therapies(df))

    return aggregate_cache.get_or_compute(key, compute)
