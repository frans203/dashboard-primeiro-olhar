"""GET /api/demographics.

Filters: ageMin, ageMax, city, incomeMin, incomeMax, parentEducation, benefit.
``sex`` is the axis of sexDistribution — it is accepted by the query DTO for
symmetry with other charts but deliberately NOT applied here.
Response: DemographicsResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, demographics
from cache import aggregate_cache, make_key
from dtos import DemographicsQuery, DemographicsResponse

router = APIRouter(prefix="/api", tags=["demographics"])


@router.get("/demographics", response_model=DemographicsResponse)
def get_demographics(q: Annotated[DemographicsQuery, Query()]) -> DemographicsResponse:
    key = make_key(
        "demographics",
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

    def compute() -> DemographicsResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
            parentEducation=q.parentEducation.value if q.parentEducation else None,
            benefit=q.benefit.value if q.benefit else None,
        )
        return DemographicsResponse(**demographics(df))

    return aggregate_cache.get_or_compute(key, compute)
