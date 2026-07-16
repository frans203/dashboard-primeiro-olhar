"""GET /api/neonatal — TODO.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, sex, deliveryType, nicu.
Response: NeonatalResponse.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import NeonatalQuery, NeonatalResponse

# from analytics import apply_filters, neonatal

router = APIRouter(prefix="/api", tags=["neonatal"])


@router.get("/neonatal", response_model=NeonatalResponse)
def get_neonatal(q: Annotated[NeonatalQuery, Query()]) -> NeonatalResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #   incomeMin=q.incomeMin, incomeMax=q.incomeMax, sex=q.sex, deliveryType=q.deliveryType,
    #   nicu=q.nicu). deliveryType/nicu are axes here — decide per-chart whether to omit them.
    #   return NeonatalResponse(**neonatal(df))
    raise HTTPException(status_code=501, detail="Not implemented")
