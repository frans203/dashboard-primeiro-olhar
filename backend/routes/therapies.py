"""GET /api/therapies — TODO.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, parentEducation, benefit.
Response: TherapiesResponse.

NOTE: distinct from /api/filters/therapies (the implemented filter-options list).
This route returns the therapy access *rate* and the *top therapies* aggregate.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import TherapiesQuery, TherapiesResponse

# from analytics import apply_filters, therapies

router = APIRouter(prefix="/api", tags=["therapies"])


@router.get("/therapies", response_model=TherapiesResponse)
def get_therapies(q: Annotated[TherapiesQuery, Query()]) -> TherapiesResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #   incomeMin=q.incomeMin, incomeMax=q.incomeMax, parentEducation=q.parentEducation,
    #   benefit=q.benefit)  # do NOT filter by `therapy` — it is the axis here.
    #   return TherapiesResponse(**therapies(df))
    raise HTTPException(status_code=501, detail="Not implemented")
