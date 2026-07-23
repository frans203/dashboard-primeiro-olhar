"""Pydantic DTOs.

Two families:

* **Query DTOs** — one per route, holding only the subset of filters that route
  accepts (all optional). Used as FastAPI query-parameter models. Enum fields are
  validated strictly by their type; ``city`` is validated against the known-cities
  set (spaces are already URL-decoded by the framework).
* **Response DTOs** — typed shapes returned by each route. They are defined for every
  route, including the ones whose body is still a ``# TODO``.

Distribution endpoints use the uniform ``{label, count}`` item shape.

The ``Upload*Query`` models at the bottom mirror the query DTOs above for the
``/api/uploads`` routes; they differ only in how ``city`` is validated (see the note
there).
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, field_validator

from enums import (
    Benefit,
    DeliveryType,
    ParentEducation,
    Sex,
    Therapy,
)

# --------------------------------------------------------------------------- #
# Shared primitives
# --------------------------------------------------------------------------- #


class KeyLabel(BaseModel):
    """A filter option: ``key`` is echoed back as the filter value, ``label`` is shown."""

    key: str
    label: str


class LabelCount(BaseModel):
    """Uniform distribution item used by every count-based chart."""

    label: str
    count: int


# --------------------------------------------------------------------------- #
# Query DTOs (one per route, pertinent subset only)
# --------------------------------------------------------------------------- #


class _CityValidatedMixin(BaseModel):
    """Mixin adding strict known-city validation to an optional ``city`` field."""

    city: Optional[str] = None

    @field_validator("city")
    @classmethod
    def _check_city(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # import here to avoid a circular import at module load time
        from enums import validate_city

        return validate_city(v.strip())


class DemographicsQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None
    sex: Optional[Sex] = None


class NeonatalQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    sex: Optional[Sex] = None
    deliveryType: Optional[DeliveryType] = None
    nicu: Optional[bool] = None


class DiagnosisQuery(_CityValidatedMixin):
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None


class HealthQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    sex: Optional[Sex] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None


class TherapiesQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None


class SocioeconomicQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None


class IncomeTherapiesQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    sex: Optional[Sex] = None


class DeliveryComplicationsQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    sex: Optional[Sex] = None


class BpcIncomeQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None


class IndicatorsQuery(_CityValidatedMixin):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None
    sex: Optional[Sex] = None


# --------------------------------------------------------------------------- #
# Response DTOs
# --------------------------------------------------------------------------- #


class TherapiesFilterResponse(BaseModel):
    therapies: list[KeyLabel]


class DemographicsResponse(BaseModel):
    ageDistribution: list[LabelCount]
    sexDistribution: list[LabelCount]
    topCities: list[LabelCount]
    topMaternities: list[LabelCount]


class NeonatalResponse(BaseModel):
    apgar1minAvg: Optional[float]
    apgar5minAvg: Optional[float]
    deliveryType: list[LabelCount]
    nicuRate: float
    complications: list[LabelCount]


class DiagnosisResponse(BaseModel):
    diagnosisMoment: list[LabelCount]


class HealthResponse(BaseModel):
    frequentDiseases: list[LabelCount]
    surgeryRate: list[LabelCount]


class TherapiesResponse(BaseModel):
    therapyRate: float
    topTherapies: list[LabelCount]


class ParentEducationRow(BaseModel):
    label: str
    mother: int
    father: int


class SocialBenefitRow(BaseModel):
    label: str
    receives: int
    doesNotReceive: int


class SocioeconomicResponse(BaseModel):
    incomeDistribution: list[LabelCount]
    familyStructure: list[LabelCount]
    parentEducation: list[ParentEducationRow]
    socialBenefits: list[SocialBenefitRow]


class IncomeTherapyRow(BaseModel):
    income: str
    withTherapy: int
    withoutTherapy: int


class IncomeTherapiesResponse(BaseModel):
    rows: list[IncomeTherapyRow]


class DeliveryComplicationRow(BaseModel):
    deliveryType: str
    withComplications: int
    withoutComplications: int


class DeliveryComplicationsResponse(BaseModel):
    rows: list[DeliveryComplicationRow]


class BpcIncomeRow(BaseModel):
    income: str
    receivesBpc: int
    doesNotReceiveBpc: int


class BpcIncomeResponse(BaseModel):
    rows: list[BpcIncomeRow]


class IndicatorsResponse(BaseModel):
    apgar1minAvg: Optional[float]
    apgar5minAvg: Optional[float]
    therapyRate: float
    surgeryRate: float
    totalChildren: int


# --------------------------------------------------------------------------- #
# Uploaded dataset (mirror routes under /api/uploads)
# --------------------------------------------------------------------------- #


class UploadStatusResponse(BaseModel):
    """Metadata of the CSV currently loaded in the uploaded-dataset slot."""

    filename: str
    rowCount: int
    uploadedAt: str
    version: int
    warnings: list[str] = []


# The mirror routes take the SAME filter subsets as their ``/api`` counterparts; only
# ``city`` differs. It cannot be validated by a field validator here because the valid
# set belongs to whichever file was uploaded — the route validates it against
# ``uploaded_dataset.uploaded_cities()`` instead (422 for an unknown one), so a legit
# city of the uploaded file is never rejected for being absent from the institute's.
class _UploadQuery(BaseModel):
    city: Optional[str] = None


class UploadDemographicsQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None
    sex: Optional[Sex] = None


class UploadNeonatalQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    sex: Optional[Sex] = None
    deliveryType: Optional[DeliveryType] = None
    nicu: Optional[bool] = None


class UploadDiagnosisQuery(_UploadQuery):
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None


class UploadHealthQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    sex: Optional[Sex] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None


class UploadTherapiesQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None


class UploadSocioeconomicQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None


class UploadIncomeTherapiesQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    sex: Optional[Sex] = None


class UploadDeliveryComplicationsQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    sex: Optional[Sex] = None


class UploadBpcIncomeQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None


class UploadIndicatorsQuery(_UploadQuery):
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    incomeMin: Optional[int] = None
    incomeMax: Optional[int] = None
    parentEducation: Optional[ParentEducation] = None
    benefit: Optional[Benefit] = None
    sex: Optional[Sex] = None
