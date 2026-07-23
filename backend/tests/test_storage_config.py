"""A misconfigured deploy must explain itself, not crash.

The first Vercel deploy died with a ``FileNotFoundError`` deep inside pandas because
the function had no Blob token and the loader quietly fell back to a disk that does not
exist there. These tests pin the behaviour that replaced it: say what is missing, keep
the service up, and leave ``/api/uploads/*`` working.
"""

import pytest
from fastapi.testclient import TestClient

import cleaning
from cache import aggregate_cache
from cleaning import DatasetUnavailable
from main import app

client = TestClient(app)


def setup_function():
    aggregate_cache.clear()
    cleaning.get_clean_df.cache_clear()


def teardown_function():
    cleaning.get_clean_df.cache_clear()


def test_blob_path_without_token_names_the_missing_variable(monkeypatch):
    monkeypatch.setenv("INSTITUTE_BLOB_PATH", "Formulario2_Resumido.tsv")
    monkeypatch.setenv("BLOB_READ_WRITE_TOKEN", "")

    with pytest.raises(DatasetUnavailable) as exc:
        cleaning.load_raw_df()

    message = str(exc.value)
    assert "INSTITUTE_BLOB_PATH" in message
    assert "BLOB_READ_WRITE_TOKEN" in message


def test_missing_file_locally_points_at_the_disk_fix(monkeypatch):
    """Local advice must be local: put the file there (or set DATA_PATH)."""
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.setattr(cleaning, "TSV_PATH", "/caminho/que/nao/existe.tsv")

    with pytest.raises(DatasetUnavailable) as exc:
        cleaning.load_raw_df()

    message = str(exc.value)
    assert "/caminho/que/nao/existe.tsv" in message
    assert "DATA_PATH" in message
    # Telling someone running locally to upload to a Blob store would be noise.
    assert "INSTITUTE_BLOB_PATH" not in message


def test_missing_file_on_vercel_points_at_the_blob_fix(monkeypatch):
    """On a serverless host the disk is not an option, so the advice changes."""
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setattr(cleaning, "TSV_PATH", "/caminho/que/nao/existe.tsv")

    with pytest.raises(DatasetUnavailable) as exc:
        cleaning.load_raw_df()

    assert "INSTITUTE_BLOB_PATH" in str(exc.value)


def test_institute_routes_answer_503_instead_of_dying(monkeypatch):
    """The whole point: a configuration mistake is a readable HTTP answer."""
    monkeypatch.setattr(cleaning, "TSV_PATH", "/caminho/que/nao/existe.tsv")

    resp = client.get("/api/indicators")
    assert resp.status_code == 503
    assert "DATA_PATH" in resp.json()["detail"]


def test_service_stays_up_when_the_dataset_cannot_load(monkeypatch):
    monkeypatch.setattr(cleaning, "TSV_PATH", "/caminho/que/nao/existe.tsv")

    # Root and the upload routes do not depend on the institute file.
    assert client.get("/").status_code == 200
    assert client.get("/api/uploads/current").status_code == 404
    assert client.get("/api/filters/therapies").status_code == 200
