"""GET /api/demographics — TODO.

Filters: ageMin, ageMax, city, incomeMin, incomeMax, parentEducation, benefit, sex.
Response: DemographicsResponse.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import DemographicsQuery, DemographicsResponse

# from analytics import apply_filters, demographics
# from cache import aggregate_cache, make_key

router = APIRouter(prefix="/api", tags=["demographics"])


@router.get("/demographics", response_model=DemographicsResponse)
def get_demographics(q: Annotated[DemographicsQuery, Query()]) -> DemographicsResponse:
    # TODO: cache key from q; on miss ->
    #   df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #                      incomeMin=q.incomeMin, incomeMax=q.incomeMax,
    #                      parentEducation=q.parentEducation, benefit=q.benefit)
    #   NOTE: `sex` is the axis of sexDistribution -> do NOT filter by sex here.
    #   return DemographicsResponse(**demographics(df))
    raise HTTPException(status_code=501, detail="Not implemented")
