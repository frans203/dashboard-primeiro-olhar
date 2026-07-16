"""Aggregations and crossings (pandas).

The generic filter engine :func:`apply_filters` is implemented (it is shared by every
route). The per-route aggregation/crossing functions are **skeletons**: signature and
docstring are defined, the body is a ``# TODO``.

Convention: each route passes only the filters pertinent to it and *omits the filter
of its own axis* (e.g. ``/api/demographics`` never filters by ``sex`` when it is the
axis being charted — the route decides what to pass in).

Every function receives the already-filtered DataFrame (routes call
``apply_filters`` first), so aggregation functions here just group/count.
"""

from __future__ import annotations

from typing import Optional

import pandas as pd

from cleaning import get_clean_df


# --------------------------------------------------------------------------- #
# Filter engine (IMPLEMENTED — shared by all routes)
# --------------------------------------------------------------------------- #


def apply_filters(
    df: Optional[pd.DataFrame] = None,
    *,
    city: Optional[str] = None,
    ageMin: Optional[int] = None,
    ageMax: Optional[int] = None,
    incomeMin: Optional[int] = None,
    incomeMax: Optional[int] = None,
    therapy: Optional[str] = None,
    parentEducation: Optional[str] = None,
    benefit: Optional[str] = None,
    sex: Optional[str] = None,
    deliveryType: Optional[str] = None,
    nicu: Optional[bool] = None,
) -> pd.DataFrame:
    """Return a filtered copy of the cleaned DataFrame.

    Only non-``None`` arguments are applied. Callers should pass ``None`` for the
    axis being charted so a chart never filters itself out.

    - ``incomeMin``/``incomeMax`` (reais) overlap-match the row's income bracket range.
    - ``parentEducation`` matches mother OR father.
    - ``therapy`` keeps rows whose normalized therapy list contains the key.
    """
    data = get_clean_df() if df is None else df
    mask = pd.Series(True, index=data.index)

    if city is not None:
        mask &= data["city"] == city
    if ageMin is not None:
        mask &= data["age"].notna() & (data["age"] >= ageMin)
    if ageMax is not None:
        mask &= data["age"].notna() & (data["age"] <= ageMax)
    if incomeMin is not None:
        # keep rows whose bracket max is >= requested floor
        mask &= data["income_max"].notna() & (data["income_max"] >= incomeMin)
    if incomeMax is not None:
        mask &= data["income_min"].notna() & (data["income_min"] <= incomeMax)
    if therapy is not None:
        mask &= data["therapies"].map(lambda ts: therapy in ts)
    if parentEducation is not None:
        mask &= (data["mother_education"] == parentEducation) | (
            data["father_education"] == parentEducation
        )
    if benefit is not None:
        col = "bpc" if benefit == "bpc" else "government_aid"
        mask &= data[col] == True  # noqa: E712
    if sex is not None:
        mask &= data["sex"] == sex
    if deliveryType is not None:
        mask &= data["delivery_type"] == deliveryType
    if nicu is not None:
        mask &= data["nicu"] == nicu

    return data[mask]


# --------------------------------------------------------------------------- #
# Small shared helpers (IMPLEMENTED)
# --------------------------------------------------------------------------- #


def mean_ignoring_missing(series: pd.Series) -> Optional[float]:
    """Mean of a numeric series, ignoring NaN. Returns ``None`` for an all-missing
    series. Used for Apgar averages (absent scores must never count as zero)."""
    valid = series.dropna()
    if valid.empty:
        return None
    return round(float(valid.mean()), 2)


def explode_counts(df: pd.DataFrame, column: str) -> pd.Series:
    """Explode a list-valued column and return value counts (descending)."""
    return df[column].explode().dropna().value_counts()


# --------------------------------------------------------------------------- #
# Aggregations — SKELETONS (# TODO)
# --------------------------------------------------------------------------- #


def demographics(df: pd.DataFrame) -> dict:
    """Age distribution, sex distribution, top cities, top maternities.

    Returns a dict shaped like ``DemographicsResponse``.
    """
    # TODO: bucket ages into ranges -> ageDistribution (list[{label,count}])
    # TODO: value_counts on sex -> sexDistribution (map keys to pt-BR labels)
    # TODO: top N cities by count -> topCities
    # TODO: top N maternities by count -> topMaternities
    raise NotImplementedError


def neonatal(df: pd.DataFrame) -> dict:
    """Apgar averages, delivery type split, NICU rate, complications.

    Returns a dict shaped like ``NeonatalResponse``.
    """
    # TODO: apgar1minAvg/apgar5minAvg via mean_ignoring_missing
    # TODO: delivery_type value_counts -> deliveryType
    # TODO: nicuRate = share of nicu == True over known values
    # TODO: neonatal_complication counts -> complications
    raise NotImplementedError


def diagnosis(df: pd.DataFrame) -> dict:
    """Diagnosis moment distribution. Shaped like ``DiagnosisResponse``."""
    # TODO: value_counts on diagnosis_moment -> diagnosisMoment
    raise NotImplementedError


def health(df: pd.DataFrame) -> dict:
    """Frequent diseases + surgery rate. Shaped like ``HealthResponse``."""
    # TODO: explode_counts(df, "diseases") top N -> frequentDiseases
    # TODO: cardiac_surgery yes/no counts -> surgeryRate
    raise NotImplementedError


def therapies(df: pd.DataFrame) -> dict:
    """Therapy access rate + top therapies. Shaped like ``TherapiesResponse``."""
    # TODO: therapyRate = share of children with >=1 therapy
    # TODO: explode_counts(df, "therapies"), map keys -> pt-BR labels -> topTherapies
    raise NotImplementedError


def socioeconomic(df: pd.DataFrame) -> dict:
    """Income, family structure, parent education, benefits.

    Shaped like ``SocioeconomicResponse``.
    """
    # TODO: income_label counts ordered by income_order -> incomeDistribution
    # TODO: mother_marital_status counts -> familyStructure
    # TODO: mother/father education side by side -> parentEducation (list[{label,mother,father}])
    # TODO: bpc + government_aid receives/doesNotReceive -> socialBenefits
    raise NotImplementedError


def crossing_income_therapies(df: pd.DataFrame) -> dict:
    """Income x therapy access. Shaped like ``IncomeTherapiesResponse``."""
    # TODO: for each income bracket, count with/without any therapy -> rows
    raise NotImplementedError


def crossing_delivery_complications(df: pd.DataFrame) -> dict:
    """Delivery type x neonatal complications. Shaped like ``DeliveryComplicationsResponse``."""
    # TODO: for each delivery_type, count with/without neonatal_complication -> rows
    raise NotImplementedError


def crossing_bpc_income(df: pd.DataFrame) -> dict:
    """BPC receipt x income. Shaped like ``BpcIncomeResponse``."""
    # TODO: for each income bracket, count receives/doesNotReceive BPC -> rows
    raise NotImplementedError


def indicators(df: pd.DataFrame) -> dict:
    """Top-of-page indicator cards. Shaped like ``IndicatorsResponse``."""
    # TODO: apgar averages, therapyRate, surgeryRate, totalChildren = len(df)
    raise NotImplementedError
