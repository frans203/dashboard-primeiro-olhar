"""GET /api/diagnosis — TODO.

Filters: city, incomeMin, incomeMax, parentEducation, benefit.
Response: DiagnosisResponse.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import DiagnosisQuery, DiagnosisResponse

# from analytics import apply_filters, diagnosis

router = APIRouter(prefix="/api", tags=["diagnosis"])


@router.get("/diagnosis", response_model=DiagnosisResponse)
def get_diagnosis(q: Annotated[DiagnosisQuery, Query()]) -> DiagnosisResponse:
    # TODO: df = apply_filters(city=q.city, incomeMin=q.incomeMin, incomeMax=q.incomeMax,
    #   parentEducation=q.parentEducation, benefit=q.benefit)
    #   return DiagnosisResponse(**diagnosis(df))
    raise HTTPException(status_code=501, detail="Not implemented")
