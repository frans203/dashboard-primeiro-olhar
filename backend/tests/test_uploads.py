"""Tests for the uploaded-CSV feature: lifecycle, mirror aggregates, isolation.

Per the backend testing rule, the new surface ships with coverage of its aggregates —
here that also means proving the two datasets never contaminate each other: the
``/api`` routes must keep answering from the bundled TSV after an upload, and a
replacement upload must not return the previous file's cached numbers.
"""

import csv
import io

import pandas as pd
from fastapi.testclient import TestClient

from cache import aggregate_cache
from cleaning import REQUIRED_COLUMNS, load_raw_df
from main import app
from uploaded_dataset import clear_uploaded, upload_cache

client = TestClient(app)


def setup_function():
    aggregate_cache.clear()
    clear_uploaded()


def teardown_module():
    clear_uploaded()


# --------------------------------------------------------------------------- #
# Fixtures: files built from the real TSV so the values are realistic
# --------------------------------------------------------------------------- #


def _serialize(df: pd.DataFrame, sep: str) -> bytes:
    buffer = io.StringIO()
    df.to_csv(buffer, sep=sep, index=False, quoting=csv.QUOTE_MINIMAL)
    return buffer.getvalue().encode("utf-8")


def _sample(rows: int = 40, sep: str = ",") -> bytes:
    """First ``rows`` rows of the institute TSV, re-serialized with ``sep``."""
    return _serialize(load_raw_df().head(rows), sep)


def _upload(content: bytes, filename: str = "amostra.csv"):
    return client.post(
        "/api/uploads",
        files={"file": (filename, content, "text/csv")},
    )


# --------------------------------------------------------------------------- #
# Lifecycle
# --------------------------------------------------------------------------- #


def test_upload_comma_csv_returns_status():
    resp = _upload(_sample(40, ","))
    assert resp.status_code == 200
    body = resp.json()
    assert body["filename"] == "amostra.csv"
    assert body["rowCount"] == 40
    assert body["version"] >= 1
    assert body["uploadedAt"]


def test_upload_accepts_tab_separated():
    resp = _upload(_sample(25, "\t"), filename="amostra.tsv")
    assert resp.status_code == 200
    assert resp.json()["rowCount"] == 25


def test_upload_accepts_semicolon_separated():
    resp = _upload(_sample(15, ";"))
    assert resp.status_code == 200
    assert resp.json()["rowCount"] == 15


def test_upload_missing_columns_400_lists_them():
    df = load_raw_df().head(10).drop(columns=["Renda_Familiar", "Terapias"])
    resp = _upload(_serialize(df, ","))
    assert resp.status_code == 400
    detail = resp.json()["detail"]
    assert "Renda_Familiar" in detail
    assert "Terapias" in detail


def test_upload_rejects_unsupported_extension():
    resp = _upload(_sample(5), filename="planilha.xlsx")
    assert resp.status_code == 400
    assert "csv" in resp.json()["detail"].lower()


def test_upload_rejects_empty_file():
    resp = _upload(b"")
    assert resp.status_code == 400


def test_upload_header_only_file_400():
    header = ",".join(REQUIRED_COLUMNS).encode("utf-8")
    resp = _upload(header)
    assert resp.status_code == 400
    assert "linha" in resp.json()["detail"].lower()


def test_current_404_before_upload_then_200_then_deleted():
    assert client.get("/api/uploads/current").status_code == 404

    _upload(_sample(12))
    current = client.get("/api/uploads/current")
    assert current.status_code == 200
    assert current.json()["rowCount"] == 12

    assert client.delete("/api/uploads/current").status_code == 204
    assert client.get("/api/uploads/current").status_code == 404


# --------------------------------------------------------------------------- #
# Aggregates over the uploaded dataset
# --------------------------------------------------------------------------- #


def test_aggregates_404_when_nothing_uploaded():
    for path in (
        "/api/uploads/demographics",
        "/api/uploads/neonatal",
        "/api/uploads/diagnosis",
        "/api/uploads/health",
        "/api/uploads/therapies",
        "/api/uploads/socioeconomic",
        "/api/uploads/indicators",
        "/api/uploads/crossings/income-therapies",
        "/api/uploads/crossings/delivery-complications",
        "/api/uploads/crossings/bpc-income",
    ):
        assert client.get(path).status_code == 404, path


def test_indicators_count_matches_uploaded_rows():
    _upload(_sample(40))
    resp = client.get("/api/uploads/indicators")
    assert resp.status_code == 200
    assert resp.json()["totalChildren"] == 40


def test_every_aggregate_answers_over_the_upload():
    _upload(_sample(60))

    demographics = client.get("/api/uploads/demographics").json()
    assert sum(s["count"] for s in demographics["sexDistribution"]) == 60
    assert demographics["topCities"]

    neonatal = client.get("/api/uploads/neonatal").json()
    assert 0.0 <= neonatal["nicuRate"] <= 1.0

    assert client.get("/api/uploads/diagnosis").json()["diagnosisMoment"]
    assert client.get("/api/uploads/health").json()["frequentDiseases"]

    therapies = client.get("/api/uploads/therapies").json()
    assert 0.0 <= therapies["therapyRate"] <= 1.0

    socioeconomic = client.get("/api/uploads/socioeconomic").json()
    assert len(socioeconomic["socialBenefits"]) == 2

    assert client.get("/api/uploads/crossings/income-therapies").json()["rows"]
    assert len(client.get("/api/uploads/crossings/delivery-complications").json()["rows"]) == 2
    assert client.get("/api/uploads/crossings/bpc-income").json()["rows"]


def test_filters_narrow_the_uploaded_population():
    _upload(_sample(80))
    total = client.get("/api/uploads/indicators").json()["totalChildren"]
    male = client.get("/api/uploads/indicators", params={"sex": "male"}).json()
    female = client.get("/api/uploads/indicators", params={"sex": "female"}).json()
    assert male["totalChildren"] + female["totalChildren"] == total
    assert male["totalChildren"] < total


def test_city_validated_against_the_uploaded_file():
    _upload(_sample(60))
    known = client.get("/api/uploads/demographics").json()["topCities"][0]["label"]

    ok = client.get("/api/uploads/demographics", params={"city": known})
    assert ok.status_code == 200

    unknown = client.get("/api/uploads/demographics", params={"city": "Cidade Inventada"})
    assert unknown.status_code == 422


# --------------------------------------------------------------------------- #
# Isolation between the two datasets
# --------------------------------------------------------------------------- #


def test_replacing_the_upload_recomputes_instead_of_serving_stale_cache():
    _upload(_sample(40))
    assert client.get("/api/uploads/indicators").json()["totalChildren"] == 40

    _upload(_sample(90))
    assert client.get("/api/uploads/indicators").json()["totalChildren"] == 90


def test_version_survives_a_stale_cache_entry():
    """Even if the cache is not cleared, the version in the key isolates uploads."""
    _upload(_sample(40))
    client.get("/api/uploads/indicators")
    stale = dict(upload_cache._store)  # noqa: SLF001 - asserting the key discipline

    _upload(_sample(90))
    upload_cache._store.update(stale)  # noqa: SLF001 - re-inject the old entries
    assert client.get("/api/uploads/indicators").json()["totalChildren"] == 90


def test_institute_routes_are_untouched_by_an_upload():
    before = client.get("/api/indicators").json()["totalChildren"]
    assert before == 355

    _upload(_sample(40))
    assert client.get("/api/uploads/indicators").json()["totalChildren"] == 40
    # the fixed dataset must not have moved
    assert client.get("/api/indicators").json()["totalChildren"] == 355
    assert client.get("/api/demographics").status_code == 200
    # a city of the institute file is still validated by the institute rules
    assert client.get("/api/demographics", params={"city": "João Pessoa"}).status_code == 200
