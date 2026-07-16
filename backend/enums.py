"""Validation enums.

Keys are in **English**; the mapping to the pt-BR values found in the file lives in
:mod:`cleaning`. Validation is strict: a value that is not a known key is rejected
(Pydantic raises on the query DTOs).

- ``Sex``, ``DeliveryType``, ``Benefit``, ``ParentEducation`` are static.
- ``Therapy`` is built at import time from the normalized therapies vector exposed by
  :mod:`cleaning` (single source of truth).
- ``City`` is validated against the set of known cities present in the cleaned data.
"""

from __future__ import annotations

from enum import Enum

from cleaning import THERAPIES, get_clean_df


class Sex(str, Enum):
    male = "male"
    female = "female"


class DeliveryType(str, Enum):
    cesarean = "cesarean"
    vaginal = "vaginal"


class Benefit(str, Enum):
    bpc = "bpc"
    aid = "aid"


class ParentEducation(str, Enum):
    notLiterate = "notLiterate"
    elementary = "elementary"
    highSchool = "highSchool"
    higherIncomplete = "higherIncomplete"
    higherComplete = "higherComplete"
    postgraduate = "postgraduate"


# ``Therapy`` is dynamic: keys come from the cleaning vector so the enum, the
# validation and the /api/filters/therapies route can never drift apart.
Therapy = Enum(  # type: ignore[misc]
    "Therapy",
    {t["key"]: t["key"] for t in THERAPIES},
    type=str,
)


def known_cities() -> set[str]:
    """Set of city labels present in the cleaned data (includes 'Não informado')."""
    return set(get_clean_df()["city"].dropna().unique())


def validate_city(value: str) -> str:
    """Return ``value`` if it is a known city, else raise ``ValueError`` (strict)."""
    cities = known_cities()
    if value not in cities:
        raise ValueError(f"Unknown city: {value!r}")
    return value
