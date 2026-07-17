"""GET /api/crossings/bpc-income.

Filters: city, ageMin, ageMax, parentEducation.
BPC and income are the axes — not applied as filters.
Response: BpcIncomeResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, crossing_bpc_income
from cache import aggregate_cache, make_key
from dtos import BpcIncomeQuery, BpcIncomeResponse

router = APIRouter(prefix="/api", tags=["crossings"])


@router.get("/crossings/bpc-income", response_model=BpcIncomeResponse)
def get_bpc_income(q: Annotated[BpcIncomeQuery, Query()]) -> BpcIncomeResponse:
    key = make_key(
        "crossings/bpc-income",
        {
            "city": q.city,
            "ageMin": q.ageMin,
            "ageMax": q.ageMax,
            "parentEducation": q.parentEducation,
        },
    )

    def compute() -> BpcIncomeResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            parentEducation=q.parentEducation.value if q.parentEducation else None,
        )
        return BpcIncomeResponse(**crossing_bpc_income(df))

    return aggregate_cache.get_or_compute(key, compute)
