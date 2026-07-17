"""GET /api/diagnosis.

Filters: city, incomeMin, incomeMax, parentEducation, benefit.
Response: DiagnosisResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, diagnosis
from cache import aggregate_cache, make_key
from dtos import DiagnosisQuery, DiagnosisResponse

router = APIRouter(prefix="/api", tags=["diagnosis"])


@router.get("/diagnosis", response_model=DiagnosisResponse)
def get_diagnosis(q: Annotated[DiagnosisQuery, Query()]) -> DiagnosisResponse:
    key = make_key(
        "diagnosis",
        {
            "city": q.city,
            "incomeMin": q.incomeMin,
            "incomeMax": q.incomeMax,
            "parentEducation": q.parentEducation,
            "benefit": q.benefit,
        },
    )

    def compute() -> DiagnosisResponse:
        df = apply_filters(
            city=q.city,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
            parentEducation=q.parentEducation.value if q.parentEducation else None,
            benefit=q.benefit.value if q.benefit else None,
        )
        return DiagnosisResponse(**diagnosis(df))

    return aggregate_cache.get_or_compute(key, compute)
