"""GET /api/crossings/income-therapies — TODO.

Filters: city, ageMin, ageMax, parentEducation, sex.
Response: IncomeTherapiesResponse ({ rows: {income, withTherapy, withoutTherapy}[] }).
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import IncomeTherapiesQuery, IncomeTherapiesResponse

# from analytics import apply_filters, crossing_income_therapies

router = APIRouter(prefix="/api", tags=["crossings"])


@router.get("/crossings/income-therapies", response_model=IncomeTherapiesResponse)
def get_income_therapies(
    q: Annotated[IncomeTherapiesQuery, Query()],
) -> IncomeTherapiesResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #   parentEducation=q.parentEducation, sex=q.sex)  # income & therapy are the axes.
    #   return IncomeTherapiesResponse(**crossing_income_therapies(df))
    raise HTTPException(status_code=501, detail="Not implemented")
