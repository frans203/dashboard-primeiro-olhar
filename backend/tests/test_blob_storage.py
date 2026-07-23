"""Integration tests against a REAL Vercel Blob store.

Opt-in: skipped unless ``backend/.env`` carries a ``BLOB_READ_WRITE_TOKEN``. They talk
to the network and they write to (and clean up after themselves in) the store, so they
are not part of the default fast suite in spirit — but they are the only thing that
proves the serverless path works before a deploy.

``conftest`` blanks the Blob variables for the whole session; each test here restores
them with ``monkeypatch`` (auto-reverted) so the rest of the suite stays offline.
"""

import os

import pytest
from dotenv import dotenv_values

import blob_storage
import cleaning
import uploaded_dataset
from cleaning import load_raw_df

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV = dotenv_values(os.path.join(BACKEND_DIR, ".env"))
_TOKEN = (_ENV.get("BLOB_READ_WRITE_TOKEN") or "").strip()
_INSTITUTE_PATH = (_ENV.get("INSTITUTE_BLOB_PATH") or "").strip()

pytestmark = pytest.mark.skipif(
    not _TOKEN,
    reason="sem BLOB_READ_WRITE_TOKEN em backend/.env — testes de Blob ignorados",
)


@pytest.fixture
def blob_env(monkeypatch):
    """Turn the Blob backend on for one test, then leave everything as it was."""
    monkeypatch.setenv("BLOB_READ_WRITE_TOKEN", _TOKEN)
    monkeypatch.setenv("INSTITUTE_BLOB_PATH", _INSTITUTE_PATH)
    uploaded_dataset._blob_cache.clear()  # noqa: SLF001 - per-process memoization
    yield
    uploaded_dataset._blob_cache.clear()  # noqa: SLF001
    cleaning.get_clean_df.cache_clear()


def _sample_bytes(rows: int) -> bytes:
    """A CSV in the institute's format, built from the local TSV."""
    return load_raw_df().head(rows).to_csv(index=False).encode("utf-8")


# --------------------------------------------------------------------------- #
# Store wiring
# --------------------------------------------------------------------------- #


def test_backend_switches_on_with_the_token(blob_env):
    assert blob_storage.enabled() is True
    assert blob_storage.institute_path() == _INSTITUTE_PATH


def test_institute_tsv_is_read_from_the_store(blob_env):
    """The dataset the /api routes serve comes from Blob, not from disk."""
    cleaning.get_clean_df.cache_clear()
    df = cleaning.get_clean_df()
    assert len(df) == 355
    assert df["city"].notna().any()


# --------------------------------------------------------------------------- #
# Uploaded dataset round-trip
# --------------------------------------------------------------------------- #


def test_upload_round_trip_through_the_store(blob_env):
    uploaded_dataset.clear_uploaded()
    assert uploaded_dataset.get_uploaded() is None

    dataset = uploaded_dataset.set_uploaded(_sample_bytes(40), "amostra40.csv")
    assert dataset.row_count == 40
    assert dataset.filename == "amostra40.csv"
    assert dataset.version > 0

    # Read back as a DIFFERENT copy of the app would: no process memory, only the store.
    uploaded_dataset._blob_cache.clear()  # noqa: SLF001
    fetched = uploaded_dataset.get_uploaded()
    assert fetched is not None
    assert fetched.row_count == 40
    assert fetched.filename == "amostra40.csv"
    assert fetched.version == dataset.version

    uploaded_dataset.clear_uploaded()
    assert uploaded_dataset.get_uploaded() is None


def test_newest_upload_wins_and_old_ones_are_not_served(blob_env):
    uploaded_dataset.clear_uploaded()
    uploaded_dataset.set_uploaded(_sample_bytes(40), "primeiro.csv")
    second = uploaded_dataset.set_uploaded(_sample_bytes(90), "segundo.csv")

    uploaded_dataset._blob_cache.clear()  # noqa: SLF001
    current = uploaded_dataset.get_uploaded()
    assert current is not None
    assert current.row_count == 90
    assert current.filename == "segundo.csv"
    assert current.version >= second.version

    uploaded_dataset.clear_uploaded()


def test_bad_file_is_rejected_before_touching_the_store(blob_env):
    uploaded_dataset.clear_uploaded()
    before = len(blob_storage.list_uploads())

    with pytest.raises(uploaded_dataset.DatasetError):
        uploaded_dataset.set_uploaded(b"coluna_a,coluna_b\n1,2\n", "errado.csv")

    assert len(blob_storage.list_uploads()) == before
    assert uploaded_dataset.get_uploaded() is None
