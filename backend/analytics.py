"""Aggregations and crossings (pandas).

The generic filter engine :func:`apply_filters` is implemented (it is shared by every
route). Per-route aggregation/crossing functions receive the already-filtered
DataFrame and return dicts matching the response DTOs.

Convention: each route passes only the filters pertinent to it and *omits the filter
of its own axis* (e.g. ``/api/demographics`` never filters by ``sex`` when it is the
axis being charted — the route decides what to pass in).
"""

from __future__ import annotations

from typing import Any, Optional, cast

import pandas as pd

from cleaning import (
    INCOME_BRACKETS,
    THERAPIES,
    get_clean_df,
)

# --------------------------------------------------------------------------- #
# Display labels (english keys -> pt-BR)
# --------------------------------------------------------------------------- #

SEX_LABELS = {"male": "Masculino", "female": "Feminino"}
DELIVERY_LABELS = {"cesarean": "Cesárea", "vaginal": "Normal"}
MARITAL_LABELS = {
    "married": "Casada",
    "single": "Solteira",
    "stableUnion": "União estável",
    "divorced": "Divorciada",
    "widowed": "Viúva",
}
EDUCATION_LABELS = {
    "notLiterate": "Não alfabetizado(a)",
    "elementary": "Ensino fundamental",
    "highSchool": "Ensino médio",
    "higherIncomplete": "Ensino superior incompleto",
    "higherComplete": "Ensino superior completo",
    "postgraduate": "Pós-graduação",
}
BOOL_LABELS = {True: "Sim", False: "Não"}
THERAPY_KEY_TO_LABEL = {t["key"]: t["label"] for t in THERAPIES}

#: Age buckets for the demographics age chart (inclusive ranges).
AGE_BUCKETS: list[tuple[str, int, Optional[int]]] = [
    ("0-2", 0, 2),
    ("3-5", 3, 5),
    ("6-8", 6, 8),
    ("9-11", 9, 11),
    ("12-14", 12, 14),
    ("15+", 15, None),
]

TOP_N_CITIES = 10
TOP_N_MATERNITIES = 10
TOP_N_DISEASES = 10


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

    - ``incomeMin``/``incomeMax`` (reais) are thresholds against each row's income
      bracket (the TSV stores brackets, not exact reais). ``incomeMin`` keeps rows
      whose bracket *floor* is >= the threshold; ``incomeMax`` keeps rows whose
      bracket *ceiling* is <= the threshold. A floor above every known bracket
      start (e.g. 200_000) therefore matches nobody.
    - ``parentEducation`` matches mother OR father.
    - ``therapy`` keeps rows whose normalized therapy list contains the key.
    """
    data = get_clean_df() if df is None else df
    mask = pd.Series(True, index=data.index)

    if city is not None:
        mask &= _col(data, "city") == city
    if ageMin is not None:
        age = _col(data, "age")
        mask &= age.notna() & (age >= ageMin)
    if ageMax is not None:
        age = _col(data, "age")
        mask &= age.notna() & (age <= ageMax)
    if incomeMin is not None:
        # Lower bound on the bracket floor (not the artificial open-top ceiling).
        income_min = _col(data, "income_min")
        mask &= income_min.notna() & (income_min >= incomeMin)
    if incomeMax is not None:
        # Upper bound: whole bracket must sit at or below the ceiling.
        income_max = _col(data, "income_max")
        mask &= income_max.notna() & (income_max <= incomeMax)
    if therapy is not None:
        key = therapy
        mask &= _col(data, "therapies").map(lambda ts: _list_contains(ts, key))
    if parentEducation is not None:
        mask &= (_col(data, "mother_education") == parentEducation) | (
            _col(data, "father_education") == parentEducation
        )
    if benefit is not None:
        col = "bpc" if benefit == "bpc" else "government_aid"
        mask &= _col(data, col) == True  # noqa: E712
    if sex is not None:
        mask &= _col(data, "sex") == sex
    if deliveryType is not None:
        mask &= _col(data, "delivery_type") == deliveryType
    if nicu is not None:
        mask &= _col(data, "nicu") == nicu

    return cast(pd.DataFrame, data.loc[mask])


# --------------------------------------------------------------------------- #
# Small shared helpers (IMPLEMENTED)
# --------------------------------------------------------------------------- #


def _col(df: pd.DataFrame, name: str) -> pd.Series:
    """Typed column accessor — ``df[name]`` is ``Series | DataFrame`` under pandas stubs."""
    return cast(pd.Series, df[name])


def _list_contains(value: Any, item: str) -> bool:
    """Safe ``item in value`` for Series cells that stubs type as ``Any | NAType``."""
    return isinstance(value, list) and item in value


def _count_at(counts: pd.Series, key: Any) -> int:
    """Integer count for ``key`` in a value_counts Series (0 when absent).

    Uses ``to_dict`` so boolean labels (``True``/``False``) are not treated as
    boolean indexers by ``.loc`` / ``__getitem__``.
    """
    return int(counts.to_dict().get(key, 0))


def mean_ignoring_missing(series: pd.Series) -> Optional[float]:
    """Mean of a numeric series, ignoring NaN. Returns ``None`` for an all-missing
    series. Used for Apgar averages (absent scores must never count as zero)."""
    valid = series.dropna()
    if valid.empty:
        return None
    return round(float(valid.mean()), 2)


def explode_counts(df: pd.DataFrame, column: str) -> pd.Series:
    """Explode a list-valued column and return value counts (descending)."""
    return _col(df, column).explode().dropna().value_counts()


def _label_counts(
    series: pd.Series,
    *,
    label_map: Optional[dict] = None,
    ordered_keys: Optional[list] = None,
) -> list[dict]:
    """Build ``[{label, count}, ...]`` from a categorical series.

    Missing values are dropped. When ``ordered_keys`` is given, emit that order
    (skipping keys with zero count). Otherwise sort by count descending.
    """
    counts = series.dropna().value_counts()
    present = set(counts.index)
    if ordered_keys is not None:
        items = [(k, _count_at(counts, k)) for k in ordered_keys if k in present]
    else:
        items = [(k, int(v)) for k, v in counts.items()]
    out: list[dict] = []
    for key, count in items:
        label = label_map.get(key, key) if label_map else key
        out.append({"label": label, "count": count})
    return out


def _top_n_label_counts(counts: pd.Series, n: int, *, label_map: Optional[dict] = None) -> list[dict]:
    """Take the top ``n`` entries of a value-counts series as ``{label, count}``."""
    out: list[dict] = []
    for key, count in counts.head(n).items():
        label = label_map.get(key, key) if label_map else key
        out.append({"label": str(label), "count": int(count)})
    return out


def _rate(numerator: int, denominator: int) -> float:
    """Share as a float in ``[0, 1]``, rounded to 4 decimals. Empty denom → 0.0."""
    if denominator <= 0:
        return 0.0
    return round(numerator / denominator, 4)


def _has_therapy(df: pd.DataFrame) -> pd.Series:
    return _col(df, "therapies").map(lambda ts: isinstance(ts, list) and len(ts) > 0)


def _age_bucket(age: float) -> Optional[str]:
    if pd.isna(age):
        return None
    age_i = int(age)
    for label, lo, hi in AGE_BUCKETS:
        if hi is None:
            if age_i >= lo:
                return label
        elif lo <= age_i <= hi:
            return label
    return None


# --------------------------------------------------------------------------- #
# Aggregations
# --------------------------------------------------------------------------- #


def demographics(df: pd.DataFrame) -> dict:
    """Age distribution, sex distribution, top cities, top maternities.

    Returns a dict shaped like ``DemographicsResponse``.
    """
    age_labels = [b[0] for b in AGE_BUCKETS]
    age_counts = _col(df, "age").map(_age_bucket).dropna().value_counts()
    present = set(age_counts.index)
    age_distribution = [
        {"label": label, "count": _count_at(age_counts, label)}
        for label in age_labels
        if label in present
    ]

    return {
        "ageDistribution": age_distribution,
        "sexDistribution": _label_counts(_col(df, "sex"), label_map=SEX_LABELS),
        "topCities": _top_n_label_counts(
            _col(df, "city").dropna().value_counts(), TOP_N_CITIES
        ),
        "topMaternities": _top_n_label_counts(
            _col(df, "maternity").dropna().value_counts(), TOP_N_MATERNITIES
        ),
    }


def neonatal(df: pd.DataFrame) -> dict:
    """Apgar averages, delivery type split, NICU rate, complications.

    Returns a dict shaped like ``NeonatalResponse``.
    """
    nicu_known = _col(df, "nicu").dropna()
    nicu_rate = _rate(int((nicu_known == True).sum()), len(nicu_known))  # noqa: E712

    return {
        "apgar1minAvg": mean_ignoring_missing(_col(df, "apgar_1min")),
        "apgar5minAvg": mean_ignoring_missing(_col(df, "apgar_5min")),
        "deliveryType": _label_counts(
            _col(df, "delivery_type"),
            label_map=DELIVERY_LABELS,
            ordered_keys=["cesarean", "vaginal"],
        ),
        "nicuRate": nicu_rate,
        "complications": _label_counts(
            _col(df, "neonatal_complication"),
            label_map=BOOL_LABELS,
            ordered_keys=[True, False],
        ),
    }


def diagnosis(df: pd.DataFrame) -> dict:
    """Diagnosis moment distribution. Shaped like ``DiagnosisResponse``."""
    return {
        "diagnosisMoment": _label_counts(_col(df, "diagnosis_moment")),
    }


def health(df: pd.DataFrame) -> dict:
    """Frequent diseases + surgery rate. Shaped like ``HealthResponse``."""
    return {
        "frequentDiseases": _top_n_label_counts(
            explode_counts(df, "diseases"), TOP_N_DISEASES
        ),
        "surgeryRate": _label_counts(
            _col(df, "cardiac_surgery"),
            label_map=BOOL_LABELS,
            ordered_keys=[True, False],
        ),
    }


def therapies(df: pd.DataFrame) -> dict:
    """Therapy access rate + top therapies. Shaped like ``TherapiesResponse``."""
    has = _has_therapy(df)
    therapy_rate = _rate(int(has.sum()), len(df))
    return {
        "therapyRate": therapy_rate,
        "topTherapies": _top_n_label_counts(
            explode_counts(df, "therapies"),
            len(THERAPIES),
            label_map=THERAPY_KEY_TO_LABEL,
        ),
    }


def socioeconomic(df: pd.DataFrame) -> dict:
    """Income, family structure, parent education, benefits.

    Shaped like ``SocioeconomicResponse``.
    """
    # Income in bracket order (low → high).
    income_order = [b["label"] for b in INCOME_BRACKETS]
    income_counts = _col(df, "income_label").dropna().value_counts()
    income_present = set(income_counts.index)
    income_distribution = [
        {"label": label, "count": _count_at(income_counts, label)}
        for label in income_order
        if label in income_present
    ]

    family_structure = _label_counts(
        _col(df, "mother_marital_status"),
        label_map=MARITAL_LABELS,
        ordered_keys=list(MARITAL_LABELS.keys()),
    )

    edu_keys = list(EDUCATION_LABELS.keys())
    mother_counts = _col(df, "mother_education").dropna().value_counts()
    father_counts = _col(df, "father_education").dropna().value_counts()
    mother_present = set(mother_counts.index)
    father_present = set(father_counts.index)
    parent_education = [
        {
            "label": EDUCATION_LABELS[key],
            "mother": _count_at(mother_counts, key),
            "father": _count_at(father_counts, key),
        }
        for key in edu_keys
        if key in mother_present or key in father_present
    ]

    def _benefit_row(col: str, label: str) -> dict:
        known = _col(df, col).dropna()
        return {
            "label": label,
            "receives": int((known == True).sum()),  # noqa: E712
            "doesNotReceive": int((known == False).sum()),  # noqa: E712
        }

    social_benefits = [
        _benefit_row("bpc", "BPC"),
        _benefit_row("government_aid", "Auxílio do Governo"),
    ]

    return {
        "incomeDistribution": income_distribution,
        "familyStructure": family_structure,
        "parentEducation": parent_education,
        "socialBenefits": social_benefits,
    }


def crossing_income_therapies(df: pd.DataFrame) -> dict:
    """Income x therapy access. Shaped like ``IncomeTherapiesResponse``."""
    has = _has_therapy(df)
    income_label = _col(df, "income_label")
    rows: list[dict] = []
    for bracket in INCOME_BRACKETS:
        label = bracket["label"]
        subset = income_label == label
        if not subset.any():
            continue
        with_t = int((subset & has).sum())
        without_t = int((subset & ~has).sum())
        rows.append(
            {
                "income": label,
                "withTherapy": with_t,
                "withoutTherapy": without_t,
            }
        )
    return {"rows": rows}


def crossing_delivery_complications(df: pd.DataFrame) -> dict:
    """Delivery type x neonatal complications. Shaped like ``DeliveryComplicationsResponse``."""
    delivery = _col(df, "delivery_type")
    complication = _col(df, "neonatal_complication")
    rows: list[dict] = []
    for key, label in DELIVERY_LABELS.items():
        subset = delivery == key
        known = subset & complication.notna()
        if not known.any():
            # still emit the delivery type if any rows exist for it
            if not subset.any():
                continue
            with_c, without_c = 0, 0
        else:
            with_c = int((known & (complication == True)).sum())  # noqa: E712
            without_c = int((known & (complication == False)).sum())  # noqa: E712
        rows.append(
            {
                "deliveryType": label,
                "withComplications": with_c,
                "withoutComplications": without_c,
            }
        )
    return {"rows": rows}


def crossing_bpc_income(df: pd.DataFrame) -> dict:
    """BPC receipt x income. Shaped like ``BpcIncomeResponse``."""
    income_label = _col(df, "income_label")
    bpc = _col(df, "bpc")
    rows: list[dict] = []
    for bracket in INCOME_BRACKETS:
        label = bracket["label"]
        subset = income_label == label
        known = subset & bpc.notna()
        if not subset.any():
            continue
        receives = int((known & (bpc == True)).sum())  # noqa: E712
        does_not = int((known & (bpc == False)).sum())  # noqa: E712
        rows.append(
            {
                "income": label,
                "receivesBpc": receives,
                "doesNotReceiveBpc": does_not,
            }
        )
    return {"rows": rows}


def indicators(df: pd.DataFrame) -> dict:
    """Top-of-page indicator cards. Shaped like ``IndicatorsResponse``."""
    has_therapy = _has_therapy(df)
    surgery_known = _col(df, "cardiac_surgery").dropna()
    surgery_rate = _rate(
        int((surgery_known == True).sum()), len(surgery_known)  # noqa: E712
    )
    return {
        "apgar1minAvg": mean_ignoring_missing(_col(df, "apgar_1min")),
        "apgar5minAvg": mean_ignoring_missing(_col(df, "apgar_5min")),
        "therapyRate": _rate(int(has_therapy.sum()), len(df)),
        "surgeryRate": surgery_rate,
        "totalChildren": int(len(df)),
    }
