"""Tests for every implemented aggregate/crossing route.

Per the backend testing rule, each route ships with coverage of its aggregate shape
and a few deterministic assertions against the static TSV.
"""

from fastapi.testclient import TestClient

from cache import aggregate_cache
from main import app

client = TestClient(app)


def setup_function():
    aggregate_cache.clear()


# --------------------------------------------------------------------------- #
# /api/filters/therapies (pre-existing)
# --------------------------------------------------------------------------- #


def test_filters_therapies_returns_vector():
    resp = client.get("/api/filters/therapies")
    assert resp.status_code == 200
    body = resp.json()
    keys = [t["key"] for t in body["therapies"]]
    assert "physiotherapy" in keys
    assert "occupationalTherapy" in keys
    assert len(keys) == 9
    assert all(t["label"] for t in body["therapies"])


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


def _assert_label_counts(items: list, *, min_len: int = 1) -> None:
    assert isinstance(items, list)
    assert len(items) >= min_len
    for item in items:
        assert "label" in item and "count" in item
        assert isinstance(item["label"], str) and item["label"]
        assert isinstance(item["count"], int) and item["count"] >= 0


# --------------------------------------------------------------------------- #
# /api/demographics
# --------------------------------------------------------------------------- #


def test_demographics_shape_and_sex_labels():
    resp = client.get("/api/demographics")
    assert resp.status_code == 200
    body = resp.json()
    _assert_label_counts(body["ageDistribution"])
    _assert_label_counts(body["sexDistribution"], min_len=2)
    _assert_label_counts(body["topCities"])
    _assert_label_counts(body["topMaternities"])

    sex_labels = {s["label"] for s in body["sexDistribution"]}
    assert sex_labels == {"Masculino", "Feminino"}
    sex_total = sum(s["count"] for s in body["sexDistribution"])
    assert sex_total == 355  # every row has sex in this dataset

    # age buckets are ordered low → high when present
    age_labels = [a["label"] for a in body["ageDistribution"]]
    order = ["0-2", "3-5", "6-8", "9-11", "12-14", "15+"]
    assert age_labels == [l for l in order if l in age_labels]


def test_demographics_city_filter_narrows_top_cities():
    resp = client.get("/api/demographics", params={"city": "João Pessoa"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["topCities"][0]["label"] == "João Pessoa"
    assert body["topCities"][0]["count"] > 0


def test_demographics_unknown_city_422():
    resp = client.get("/api/demographics", params={"city": "Cidade Inventada"})
    assert resp.status_code == 422


def test_demographics_sex_filter_narrows_age_distribution():
    """Age/cities/maternities charts send ``sex``; the route must honour it."""
    all_rows = client.get("/api/demographics")
    male = client.get("/api/demographics", params={"sex": "male"})
    female = client.get("/api/demographics", params={"sex": "female"})
    assert all_rows.status_code == 200
    assert male.status_code == 200
    assert female.status_code == 200

    def age_total(body: dict) -> int:
        return sum(a["count"] for a in body["ageDistribution"])

    all_n = age_total(all_rows.json())
    male_n = age_total(male.json())
    female_n = age_total(female.json())
    assert male_n > 0
    assert female_n > 0
    assert male_n < all_n
    assert female_n < all_n
    # sexDistribution collapses to the selected sex when filtered
    assert {s["label"] for s in male.json()["sexDistribution"]} == {"Masculino"}
    assert {s["label"] for s in female.json()["sexDistribution"]} == {"Feminino"}


def test_demographics_income_min_uses_bracket_floor():
    """Renda mín. thresholds on the bracket floor (highest known start ≈ 10 SM).

    Floors above every bracket start (e.g. 200_000) must match nobody — the
    open-top sentinel ceiling must not keep those rows.
    """
    from cleaning import MINIMUM_WAGE

    at_top_bracket = client.get(
        "/api/demographics", params={"incomeMin": 10 * MINIMUM_WAGE}
    )
    too_high = client.get("/api/demographics", params={"incomeMin": 200_000})
    assert at_top_bracket.status_code == 200
    assert too_high.status_code == 200

    top_n = sum(s["count"] for s in at_top_bracket.json()["sexDistribution"])
    high_n = sum(s["count"] for s in too_high.json()["sexDistribution"])
    assert top_n > 0
    assert high_n == 0


def test_demographics_income_max_is_upper_bound():
    """Renda máx. keeps only brackets whose upper bound is <= the ceiling."""
    capped = client.get("/api/demographics", params={"incomeMax": 5_000})
    assert capped.status_code == 200
    capped_total = sum(s["count"] for s in capped.json()["sexDistribution"])

    all_rows = client.get("/api/demographics")
    all_total = sum(s["count"] for s in all_rows.json()["sexDistribution"])
    assert 0 < capped_total < all_total


# --------------------------------------------------------------------------- #
# /api/neonatal
# --------------------------------------------------------------------------- #


def test_neonatal_apgar_and_delivery():
    resp = client.get("/api/neonatal")
    assert resp.status_code == 200
    body = resp.json()
    assert body["apgar1minAvg"] is not None
    assert body["apgar5minAvg"] is not None
    assert 0 <= body["apgar1minAvg"] <= 10
    assert 0 <= body["apgar5minAvg"] <= 10
    assert 0.0 <= body["nicuRate"] <= 1.0

    delivery_labels = [d["label"] for d in body["deliveryType"]]
    assert "Cesárea" in delivery_labels
    assert "Normal" in delivery_labels
    _assert_label_counts(body["complications"], min_len=1)


def test_neonatal_delivery_type_and_nicu_filters():
    """Apgar/complications charts send these; the route must honour them."""
    all_rows = client.get("/api/neonatal")
    cesarean = client.get("/api/neonatal", params={"deliveryType": "cesarean"})
    vaginal = client.get("/api/neonatal", params={"deliveryType": "vaginal"})
    nicu_yes = client.get("/api/neonatal", params={"nicu": "true"})
    nicu_no = client.get("/api/neonatal", params={"nicu": "false"})
    assert all(r.status_code == 200 for r in (all_rows, cesarean, vaginal, nicu_yes, nicu_no))

    def complication_total(body: dict) -> int:
        return sum(c["count"] for c in body["complications"])

    all_n = complication_total(all_rows.json())
    assert complication_total(cesarean.json()) < all_n
    assert complication_total(vaginal.json()) < all_n
    assert complication_total(cesarean.json()) + complication_total(vaginal.json()) <= all_n

    # Filtered delivery axis collapses to the selected type
    assert {d["label"] for d in cesarean.json()["deliveryType"]} == {"Cesárea"}
    assert {d["label"] for d in vaginal.json()["deliveryType"]} == {"Normal"}

    # NICU filter: rate becomes 1.0 or 0.0 over the known subset
    assert nicu_yes.json()["nicuRate"] == 1.0
    assert nicu_no.json()["nicuRate"] == 0.0


# --------------------------------------------------------------------------- #
# /api/diagnosis
# --------------------------------------------------------------------------- #


def test_diagnosis_moment_distribution():
    resp = client.get("/api/diagnosis")
    assert resp.status_code == 200
    body = resp.json()
    _assert_label_counts(body["diagnosisMoment"], min_len=2)
    labels = {d["label"] for d in body["diagnosisMoment"]}
    assert "Depois do parto" in labels
    assert "Gravidez" in labels
    assert sum(d["count"] for d in body["diagnosisMoment"]) == 355


# --------------------------------------------------------------------------- #
# /api/health
# --------------------------------------------------------------------------- #


def test_health_diseases_and_surgery():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    _assert_label_counts(body["frequentDiseases"])
    assert body["frequentDiseases"][0]["label"] == "Cardiopatia"
    _assert_label_counts(body["surgeryRate"], min_len=1)
    surgery_labels = {s["label"] for s in body["surgeryRate"]}
    assert surgery_labels <= {"Sim", "Não"}


# --------------------------------------------------------------------------- #
# /api/therapies
# --------------------------------------------------------------------------- #


def test_therapies_rate_and_top():
    resp = client.get("/api/therapies")
    assert resp.status_code == 200
    body = resp.json()
    assert 0.0 <= body["therapyRate"] <= 1.0
    _assert_label_counts(body["topTherapies"])
    # labels are pt-BR from the therapies vector
    assert any(t["label"] == "Fisioterapia" for t in body["topTherapies"])


# --------------------------------------------------------------------------- #
# /api/socioeconomic
# --------------------------------------------------------------------------- #


def test_socioeconomic_shape():
    resp = client.get("/api/socioeconomic")
    assert resp.status_code == 200
    body = resp.json()
    _assert_label_counts(body["incomeDistribution"])
    # income brackets ordered low → high
    income_labels = [i["label"] for i in body["incomeDistribution"]]
    assert income_labels[0] == "Menos de 1 salário mínimo"

    _assert_label_counts(body["familyStructure"])
    assert len(body["parentEducation"]) >= 1
    for row in body["parentEducation"]:
        assert "label" in row and "mother" in row and "father" in row
        assert row["mother"] >= 0 and row["father"] >= 0

    assert len(body["socialBenefits"]) == 2
    benefit_labels = {b["label"] for b in body["socialBenefits"]}
    assert benefit_labels == {"BPC", "Auxílio do Governo"}


# --------------------------------------------------------------------------- #
# /api/crossings/*
# --------------------------------------------------------------------------- #


def test_crossing_income_therapies():
    resp = client.get("/api/crossings/income-therapies")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["rows"]) >= 1
    for row in body["rows"]:
        assert "income" in row
        assert row["withTherapy"] >= 0
        assert row["withoutTherapy"] >= 0
    # row totals across brackets should equal population
    total = sum(r["withTherapy"] + r["withoutTherapy"] for r in body["rows"])
    assert total == 355 or total < 355  # rows without income label are dropped


def test_crossing_delivery_complications():
    resp = client.get("/api/crossings/delivery-complications")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["rows"]) == 2
    types = {r["deliveryType"] for r in body["rows"]}
    assert types == {"Cesárea", "Normal"}
    for row in body["rows"]:
        assert row["withComplications"] >= 0
        assert row["withoutComplications"] >= 0


def test_crossing_bpc_income():
    resp = client.get("/api/crossings/bpc-income")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["rows"]) >= 1
    assert body["rows"][0]["income"] == "Menos de 1 salário mínimo"
    for row in body["rows"]:
        assert row["receivesBpc"] >= 0
        assert row["doesNotReceiveBpc"] >= 0


# --------------------------------------------------------------------------- #
# /api/indicators
# --------------------------------------------------------------------------- #


def test_indicators_kpis():
    resp = client.get("/api/indicators")
    assert resp.status_code == 200
    body = resp.json()
    assert body["totalChildren"] == 355
    assert body["apgar1minAvg"] is not None
    assert body["apgar5minAvg"] is not None
    assert 0.0 <= body["therapyRate"] <= 1.0
    assert 0.0 <= body["surgeryRate"] <= 1.0


def test_indicators_sex_filter():
    resp = client.get("/api/indicators", params={"sex": "male"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["totalChildren"] == 197
