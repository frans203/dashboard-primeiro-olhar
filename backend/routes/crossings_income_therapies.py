"""GET /api/crossings/income-therapies.

Filters: city, ageMin, ageMax, parentEducation, sex.
Income and therapy are the axes — not applied as filters.
Response: IncomeTherapiesResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, crossing_income_therapies
from cache import aggregate_cache, make_key
from dtos import IncomeTherapiesQuery, IncomeTherapiesResponse

router = APIRouter(prefix="/api", tags=["crossings"])


@router.get("/crossings/income-therapies", response_model=IncomeTherapiesResponse)
def get_income_therapies(
    q: Annotated[IncomeTherapiesQuery, Query()],
) -> IncomeTherapiesResponse:
    key = make_key(
        "crossings/income-therapies",
        {
            "city": q.city,
            "ageMin": q.ageMin,
            "ageMax": q.ageMax,
            "parentEducation": q.parentEducation,
            "sex": q.sex,
        },
    )

    def compute() -> IncomeTherapiesResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            parentEducation=q.parentEducation.value if q.parentEducation else None,
            sex=q.sex.value if q.sex else None,
        )
        return IncomeTherapiesResponse(**crossing_income_therapies(df))

    return aggregate_cache.get_or_compute(key, compute)
