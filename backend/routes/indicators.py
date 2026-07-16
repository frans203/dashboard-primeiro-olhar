"""GET /api/indicators — TODO.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, parentEducation, benefit, sex.
Response: IndicatorsResponse (top-of-page indicator cards).
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import IndicatorsQuery, IndicatorsResponse

# from analytics import apply_filters, indicators

router = APIRouter(prefix="/api", tags=["indicators"])


@router.get("/indicators", response_model=IndicatorsResponse)
def get_indicators(q: Annotated[IndicatorsQuery, Query()]) -> IndicatorsResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #   incomeMin=q.incomeMin, incomeMax=q.incomeMax, parentEducation=q.parentEducation,
    #   benefit=q.benefit, sex=q.sex)
    #   return IndicatorsResponse(**indicators(df))
    raise HTTPException(status_code=501, detail="Not implemented")
