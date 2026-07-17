"""GET /api/indicators.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, parentEducation, benefit, sex.
Response: IndicatorsResponse (top-of-page indicator cards).
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, indicators
from cache import aggregate_cache, make_key
from dtos import IndicatorsQuery, IndicatorsResponse

router = APIRouter(prefix="/api", tags=["indicators"])


@router.get("/indicators", response_model=IndicatorsResponse)
def get_indicators(q: Annotated[IndicatorsQuery, Query()]) -> IndicatorsResponse:
    key = make_key(
        "indicators",
        {
            "city": q.city,
            "ageMin": q.ageMin,
            "ageMax": q.ageMax,
            "incomeMin": q.incomeMin,
            "incomeMax": q.incomeMax,
            "parentEducation": q.parentEducation,
            "benefit": q.benefit,
            "sex": q.sex,
        },
    )

    def compute() -> IndicatorsResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
            parentEducation=q.parentEducation.value if q.parentEducation else None,
            benefit=q.benefit.value if q.benefit else None,
            sex=q.sex.value if q.sex else None,
        )
        return IndicatorsResponse(**indicators(df))

    return aggregate_cache.get_or_compute(key, compute)
