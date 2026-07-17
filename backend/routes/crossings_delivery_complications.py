"""GET /api/crossings/delivery-complications.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, sex.
Delivery type and complications are the axes — not applied as filters.
Response: DeliveryComplicationsResponse.
"""

from typing import Annotated

from fastapi import APIRouter, Query

from analytics import apply_filters, crossing_delivery_complications
from cache import aggregate_cache, make_key
from dtos import DeliveryComplicationsQuery, DeliveryComplicationsResponse

router = APIRouter(prefix="/api", tags=["crossings"])


@router.get(
    "/crossings/delivery-complications",
    response_model=DeliveryComplicationsResponse,
)
def get_delivery_complications(
    q: Annotated[DeliveryComplicationsQuery, Query()],
) -> DeliveryComplicationsResponse:
    key = make_key(
        "crossings/delivery-complications",
        {
            "city": q.city,
            "ageMin": q.ageMin,
            "ageMax": q.ageMax,
            "incomeMin": q.incomeMin,
            "incomeMax": q.incomeMax,
            "sex": q.sex,
        },
    )

    def compute() -> DeliveryComplicationsResponse:
        df = apply_filters(
            city=q.city,
            ageMin=q.ageMin,
            ageMax=q.ageMax,
            incomeMin=q.incomeMin,
            incomeMax=q.incomeMax,
            sex=q.sex.value if q.sex else None,
        )
        return DeliveryComplicationsResponse(**crossing_delivery_complications(df))

    return aggregate_cache.get_or_compute(key, compute)
