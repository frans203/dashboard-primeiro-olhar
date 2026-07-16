"""GET /api/crossings/delivery-complications — TODO.

Filters: city, ageMin, ageMax, incomeMin, incomeMax, sex.
Response: DeliveryComplicationsResponse
    ({ rows: {deliveryType, withComplications, withoutComplications}[] }).
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from dtos import DeliveryComplicationsQuery, DeliveryComplicationsResponse

# from analytics import apply_filters, crossing_delivery_complications

router = APIRouter(prefix="/api", tags=["crossings"])


@router.get(
    "/crossings/delivery-complications",
    response_model=DeliveryComplicationsResponse,
)
def get_delivery_complications(
    q: Annotated[DeliveryComplicationsQuery, Query()],
) -> DeliveryComplicationsResponse:
    # TODO: df = apply_filters(city=q.city, ageMin=q.ageMin, ageMax=q.ageMax,
    #   incomeMin=q.incomeMin, incomeMax=q.incomeMax, sex=q.sex)  # delivery & complication are axes.
    #   return DeliveryComplicationsResponse(**crossing_delivery_complications(df))
    raise HTTPException(status_code=501, detail="Not implemented")
