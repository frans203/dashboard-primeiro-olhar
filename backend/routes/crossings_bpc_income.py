"""GET /api/crossings/bpc-income — TODO.

Filters: city, ageMin, ageMax, parentEducation.
Response: BpcIncomeResponse ({ rows: {income, receivesBpc, doesNotReceiveBpc}[] }).
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import BpcIncomeQuery, BpcIncomeResponse

# from analytics import apply_filters, crossing_bpc_income

router = APIRouter(prefix="/api", tags=["crossings"])


@router.get("/crossings/bpc-income", response_model=BpcIncomeResponse)
def get_bpc_income(q: Annotated[BpcIncomeQuery, Query()]) -> BpcIncomeResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #   parentEducation=q.parentEducation)  # bpc & income are the axes -> don't filter them.
    #   return BpcIncomeResponse(**crossing_bpc_income(df))
    raise HTTPException(status_code=501, detail="Not implemented")
