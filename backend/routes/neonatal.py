"""GET /api/neonatal.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, sex, deliveryType, nicu.
``deliveryType`` / ``nicu`` are omitted by their own axis charts, but applied when
other neonatal charts (Apgar, complications) send them.
Response: NeonatalResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, neonatal
from cache import aggregate_cache, make_key
from dtos import NeonatalQuery, NeonatalResponse

router = APIRouter(prefix="/api", tags=["neonatal"])


@router.get("/neonatal", response_model=NeonatalResponse)
def get_neonatal(q: Annotated[NeonatalQuery, Query()]) -> NeonatalResponse:
    key = make_key(
        "neonatal",
        {
            "city": q.city,
            "ageMin": q.ageMin,
            "ageMax": q.ageMax,
            "incomeMin": q.incomeMin,
            "incomeMax": q.incomeMax,
            "sex": q.sex,
            "deliveryType": q.deliveryType,
            "nicu": q.nicu,
        },
    )

    def compute() -> NeonatalResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
            sex=q.sex.value if q.sex else None,
            deliveryType=q.deliveryType.value if q.deliveryType else None,
            nicu=q.nicu,
        )
        return NeonatalResponse(**neonatal(df))

    return aggregate_cache.get_or_compute(key, compute)
