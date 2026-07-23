"""GET /api/demographics.

Filters: ageMin, ageMax, city, incomeMin, incomeMax, parentEducation, benefit, sex.
``sex`` is omitted by the sex-distribution chart (it is that chart's axis) but is
applied for the other demographics charts (age, cities, maternities).
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
            "sex": q.sex,
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
            sex=q.sex.value if q.sex else None,
        )
        return DemographicsResponse(**demographics(df))

    return aggregate_cache.get_or_compute(key, compute)
