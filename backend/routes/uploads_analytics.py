"""The ``/api`` aggregates, recomputed over the uploaded CSV.

Ten routes mirroring their ``/api`` counterparts one-for-one under ``/api/uploads``:
same paths, same query DTOs, same response DTOs, same aggregation functions. The only
difference is the source frame — ``apply_filters`` already takes a ``df``, so nothing
in :mod:`analytics` needed to change and there is no second implementation of anything.

Each handler is a thin declaration: which filters its route forwards (**minus its own
axis**, exactly like the institute routes) and which aggregation to run.
:func:`run_on_upload` holds the shared body — dataset lookup, city validation, cache
key, compute.
"""

from enum import Enum
from typing import Annotated, Any, Callable, Iterable

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from analytics import (
    apply_filters,
    crossing_bpc_income,
    crossing_delivery_complications,
    crossing_income_therapies,
    demographics,
    diagnosis,
    health,
    indicators,
    neonatal,
    socioeconomic,
    therapies,
)
from cache import make_key
from dtos import (
    BpcIncomeResponse,
    DeliveryComplicationsResponse,
    DemographicsResponse,
    DiagnosisResponse,
    HealthResponse,
    IncomeTherapiesResponse,
    IndicatorsResponse,
    NeonatalResponse,
    SocioeconomicResponse,
    TherapiesResponse,
    UploadBpcIncomeQuery,
    UploadDeliveryComplicationsQuery,
    UploadDemographicsQuery,
    UploadDiagnosisQuery,
    UploadHealthQuery,
    UploadIncomeTherapiesQuery,
    UploadIndicatorsQuery,
    UploadNeonatalQuery,
    UploadSocioeconomicQuery,
    UploadTherapiesQuery,
)
from uploaded_dataset import UploadedDataset, get_uploaded, upload_cache, uploaded_cities

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


# --------------------------------------------------------------------------- #
# Shared body
# --------------------------------------------------------------------------- #


def _require_dataset() -> UploadedDataset:
    dataset = get_uploaded()
    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Nenhum CSV enviado. Envie um arquivo para ver os gráficos.",
        )
    return dataset


def _validate_city(city: Any) -> Any:
    """Strict validation against the UPLOADED file's cities (not the institute's)."""
    if city is None:
        return None
    value = str(city).strip()
    if value not in uploaded_cities():
        raise HTTPException(
            status_code=422,
            detail=f"Cidade não encontrada no CSV enviado: {value!r}",
        )
    return value


def _forwarded(query: BaseModel, names: Iterable[str]) -> dict:
    """Pull the forwarded filters off the query DTO, unwrapping enums to their values."""
    out: dict = {}
    for name in names:
        value = getattr(query, name, None)
        out[name] = value.value if isinstance(value, Enum) else value
    return out


def run_on_upload(
    route: str,
    query: BaseModel,
    forwards: Iterable[str],
    aggregate: Callable[[Any], dict],
    response_model: type[BaseModel],
) -> Any:
    """Filter the uploaded frame, aggregate, cache.

    The dataset ``version`` is part of the cache key, so a replacement upload can never
    read a number computed from the previous file (``upload_cache`` is cleared on
    replacement too — the version is the belt to that pair of braces).
    """
    dataset = _require_dataset()
    filters = _forwarded(query, forwards)
    filters["city"] = _validate_city(filters.get("city"))

    key = make_key(route, {**filters, "__version": dataset.version})

    def compute() -> BaseModel:
        df = apply_filters(dataset.df, **filters)
        return response_model(**aggregate(df))

    return upload_cache.get_or_compute(key, compute)


# --------------------------------------------------------------------------- #
# Aggregates
# --------------------------------------------------------------------------- #


@router.get("/demographics", response_model=DemographicsResponse)
def upload_demographics(
    q: Annotated[UploadDemographicsQuery, Query()],
) -> DemographicsResponse:
    # ``sex`` is omitted by the sex chart (its axis) but applied for age/cities/maternities.
    return run_on_upload(
        "uploads/demographics",
        q,
        (
            "city",
            "ageMin",
            "ageMax",
            "incomeMin",
            "incomeMax",
            "parentEducation",
            "benefit",
            "sex",
        ),
        demographics,
        DemographicsResponse,
    )


@router.get("/neonatal", response_model=NeonatalResponse)
def upload_neonatal(q: Annotated[UploadNeonatalQuery, Query()]) -> NeonatalResponse:
    # ``deliveryType`` / ``nicu`` omitted by their axis charts; applied elsewhere.
    return run_on_upload(
        "uploads/neonatal",
        q,
        (
            "city",
            "ageMin",
            "ageMax",
            "incomeMin",
            "incomeMax",
            "sex",
            "deliveryType",
            "nicu",
        ),
        neonatal,
        NeonatalResponse,
    )


@router.get("/diagnosis", response_model=DiagnosisResponse)
def upload_diagnosis(q: Annotated[UploadDiagnosisQuery, Query()]) -> DiagnosisResponse:
    return run_on_upload(
        "uploads/diagnosis",
        q,
        ("city", "incomeMin", "incomeMax", "parentEducation", "benefit"),
        diagnosis,
        DiagnosisResponse,
    )


@router.get("/health", response_model=HealthResponse)
def upload_health(q: Annotated[UploadHealthQuery, Query()]) -> HealthResponse:
    return run_on_upload(
        "uploads/health",
        q,
        ("city", "ageMin", "ageMax", "sex", "incomeMin", "incomeMax"),
        health,
        HealthResponse,
    )


@router.get("/therapies", response_model=TherapiesResponse)
def upload_therapies(q: Annotated[UploadTherapiesQuery, Query()]) -> TherapiesResponse:
    # ``therapy`` is the axis here — never forwarded.
    return run_on_upload(
        "uploads/therapies",
        q,
        ("city", "ageMin", "ageMax", "incomeMin", "incomeMax", "parentEducation", "benefit"),
        therapies,
        TherapiesResponse,
    )


@router.get("/socioeconomic", response_model=SocioeconomicResponse)
def upload_socioeconomic(
    q: Annotated[UploadSocioeconomicQuery, Query()],
) -> SocioeconomicResponse:
    return run_on_upload(
        "uploads/socioeconomic",
        q,
        ("city", "ageMin", "ageMax", "incomeMin", "incomeMax", "parentEducation", "benefit"),
        socioeconomic,
        SocioeconomicResponse,
    )


@router.get("/indicators", response_model=IndicatorsResponse)
def upload_indicators(q: Annotated[UploadIndicatorsQuery, Query()]) -> IndicatorsResponse:
    return run_on_upload(
        "uploads/indicators",
        q,
        (
            "city",
            "ageMin",
            "ageMax",
            "incomeMin",
            "incomeMax",
            "parentEducation",
            "benefit",
            "sex",
        ),
        indicators,
        IndicatorsResponse,
    )


# --------------------------------------------------------------------------- #
# Crossings — the filters cut the population, never an axis of the relation.
# --------------------------------------------------------------------------- #


@router.get("/crossings/income-therapies", response_model=IncomeTherapiesResponse)
def upload_income_therapies(
    q: Annotated[UploadIncomeTherapiesQuery, Query()],
) -> IncomeTherapiesResponse:
    return run_on_upload(
        "uploads/crossings/income-therapies",
        q,
        ("city", "ageMin", "ageMax", "parentEducation", "sex"),
        crossing_income_therapies,
        IncomeTherapiesResponse,
    )


@router.get(
    "/crossings/delivery-complications", response_model=DeliveryComplicationsResponse
)
def upload_delivery_complications(
    q: Annotated[UploadDeliveryComplicationsQuery, Query()],
) -> DeliveryComplicationsResponse:
    return run_on_upload(
        "uploads/crossings/delivery-complications",
        q,
        ("city", "ageMin", "ageMax", "incomeMin", "incomeMax", "sex"),
        crossing_delivery_complications,
        DeliveryComplicationsResponse,
    )


@router.get("/crossings/bpc-income", response_model=BpcIncomeResponse)
def upload_bpc_income(q: Annotated[UploadBpcIncomeQuery, Query()]) -> BpcIncomeResponse:
    return run_on_upload(
        "uploads/crossings/bpc-income",
        q,
        ("city", "ageMin", "ageMax", "parentEducation"),
        crossing_bpc_income,
        BpcIncomeResponse,
    )
