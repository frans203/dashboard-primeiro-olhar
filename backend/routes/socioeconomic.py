"""GET /api/socioeconomic.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, parentEducation, benefit.
Response: SocioeconomicResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, socioeconomic
from cache import aggregate_cache, make_key
from dtos import SocioeconomicQuery, SocioeconomicResponse

router = APIRouter(prefix="/api", tags=["socioeconomic"])


@router.get("/socioeconomic", response_model=SocioeconomicResponse)
def get_socioeconomic(q: Annotated[SocioeconomicQuery, Query()]) -> SocioeconomicResponse:
    key = make_key(
        "socioeconomic",
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

    def compute() -> SocioeconomicResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
            parentEducation=q.parentEducation.value if q.parentEducation else None,
            benefit=q.benefit.value if q.benefit else None,
        )
        return SocioeconomicResponse(**socioeconomic(df))

    return aggregate_cache.get_or_compute(key, compute)
