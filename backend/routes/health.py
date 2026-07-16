"""GET /api/health — TODO.

Filters: city, ageMin, ageMax, sex, incomeMin, incomeMax.
Response: HealthResponse.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import HealthQuery, HealthResponse

# from analytics import apply_filters, health

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health(q: Annotated[HealthQuery, Query()]) -> HealthResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax, sex=q.sex,
    #   incomeMin=q.incomeMin, incomeMax=q.incomeMax)
    #   return HealthResponse(**health(df))
    raise HTTPException(status_code=501, detail="Not implemented")
