"""Tests for the cleaning layer (the critical, dirty-data module).

Covers the three explicitly required behaviours:
  1. Apgar mean ignoring missing values (never counting absent as zero).
  2. Explode of multivalued cells before counting.
  3. Therapy standardization unifying truncated variants.
Plus supporting cases for the scalar cleaners and the therapies vector.
"""

import pandas as pd
import pytest

import cleaning
from analytics import explode_counts, mean_ignoring_missing


# --------------------------------------------------------------------------- #
# Apgar
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("9", 9),
        ("09", 9),      # leading zero == same value
        ("08", 8),
        ("-", None),    # missing
        ("", None),
        ("10", 10),
        ("9.5", 10),    # decimal rounds
        ("8.5", 8),     # banker's? round(8.5)->8 in py3; acceptable
    ],
)
def test_clean_apgar(raw, expected):
    assert cleaning.clean_apgar(raw) == expected


def test_apgar_mean_ignores_missing():
    # two absent scores must NOT be counted as zero
    s = pd.Series([cleaning.clean_apgar(v) for v in ["9", "-", "7", "-", "8"]])
    # mean of 9,7,8 == 8.0 ; the two "-" are dropped, not treated as 0
    assert mean_ignoring_missing(s) == 8.0


def test_apgar_mean_all_missing_is_none():
    s = pd.Series([cleaning.clean_apgar(v) for v in ["-", "-", ""]])
    assert mean_ignoring_missing(s) is None


# --------------------------------------------------------------------------- #
# Multivalued explode
# --------------------------------------------------------------------------- #


def test_split_multivalue():
    assert cleaning.split_multivalue("A, B ,C") == ["A", "B", "C"]
    assert cleaning.split_multivalue("-") == []
    assert cleaning.split_multivalue("") == []


def test_explode_counts_counts_each_value_separately():
    df = pd.DataFrame({"therapies": [["a", "b"], ["a"], [], ["b", "c"]]})
    counts = explode_counts(df, "therapies")
    assert counts["a"] == 2
    assert counts["b"] == 2
    assert counts["c"] == 1


# --------------------------------------------------------------------------- #
# Therapy standardization
# --------------------------------------------------------------------------- #


def test_therapy_truncated_variant_unified():
    # "Terapia Ocupaciona" (truncated) and "Terapia Ocupacional" are the same therapy
    a = cleaning.canonicalize_therapies("Terapia Ocupaciona")
    b = cleaning.canonicalize_therapies("Terapia Ocupacional")
    assert a == b == ["occupationalTherapy"]


def test_therapy_none_option_yields_empty():
    assert cleaning.canonicalize_therapies("Nenhuma das opções") == []


def test_therapy_explode_and_dedupe():
    keys = cleaning.canonicalize_therapies("Fisioterapia, Fonoaudiologia, Fisioterapia")
    assert keys == ["physiotherapy", "speechTherapy"]  # order preserved, deduped


def test_therapies_vector_shape():
    vec = cleaning.therapies_vector()
    keys = [t["key"] for t in vec]
    assert keys == [
        "physiotherapy",
        "speechTherapy",
        "occupationalTherapy",
        "psychology",
        "psychopedagogy",
        "equineTherapy",
        "hydrotherapy",
        "psychomotricity",
        "padovan",
    ]
    assert all(t["label"] for t in vec)


# --------------------------------------------------------------------------- #
# City normalization
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize(
    "raw,city,state",
    [
        ("Recife, PE", "Recife", "PE"),
        ("Picos - PI", "Picos", "PI"),
        ("Gramado RS", "Gramado", "RS"),
        ("João Pessoa", "João Pessoa", None),
        ("ITAPOROROCA", "Itapororoca", None),
        ("Brasil", "Não informado", None),
        ("-", "Não informado", None),
        ("", "Não informado", None),
    ],
)
def test_normalize_city(raw, city, state):
    assert cleaning.normalize_city(raw) == (city, state)


# --------------------------------------------------------------------------- #
# Disease canonicalization
# --------------------------------------------------------------------------- #


def test_disease_none_and_drop_fragments():
    assert cleaning.canonicalize_diseases("Nenhuma das opções") == []
    # parenthetical enumeration tail fragments are dropped
    out = cleaning.canonicalize_diseases(
        "Problema oftálmico (miopia, astigmatismo, ceratocone...)"
    )
    assert out == ["Problema oftálmico"]


# --------------------------------------------------------------------------- #
# Full cleaned frame sanity (uses a fixed reference date -> deterministic age)
# --------------------------------------------------------------------------- #


def test_clean_df_shape_and_types():
    df = cleaning.clean_df(reference_date=pd.Timestamp("2025-01-01"))
    assert len(df) == 355
    assert df["sex"].dropna().isin(["male", "female"]).all()
    assert df["therapies"].map(lambda x: isinstance(x, list)).all()
    # apgar columns are nullable ints (or None), never negative
    valid_apgar = df["apgar_1min"].dropna()
    assert (valid_apgar >= 0).all()
