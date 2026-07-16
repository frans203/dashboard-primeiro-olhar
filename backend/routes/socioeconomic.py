"""GET /api/socioeconomic — TODO.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, parentEducation, benefit.
Response: SocioeconomicResponse.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import SocioeconomicQuery, SocioeconomicResponse

# from analytics import apply_filters, socioeconomic

router = APIRouter(prefix="/api", tags=["socioeconomic"])


@router.get("/socioeconomic", response_model=SocioeconomicResponse)
def get_socioeconomic(q: Annotated[SocioeconomicQuery, Query()]) -> SocioeconomicResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #   incomeMin=q.incomeMin, incomeMax=q.incomeMax, parentEducation=q.parentEducation,
    #   benefit=q.benefit)
    #   return SocioeconomicResponse(**socioeconomic(df))
    raise HTTPException(status_code=501, detail="Not implemented")
