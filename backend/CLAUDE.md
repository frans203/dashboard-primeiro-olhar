# Backend — Instituto Primeiro Olhar Dashboard API

FastAPI service that reads a **TSV in memory** (`data/Formulario2_Resumido.tsv`,
355 rows × 40 columns), cleans/normalizes it in the `cleaning` layer, and serves
**aggregates and crossings as JSON**. **No database.** Pandas is used at every step
(fixed project decision).

**Two datasets, one set of rules.** The bundled TSV is served under `/api` and never
changes. A CSV uploaded at runtime is served under `/api/uploads` — same routes, same
DTOs, same aggregations, held in a single replaceable in-memory slot. See
"Uploaded CSV" below.

## Run

```bash
python -m venv .venv && source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest -q
```

Interactive docs at `http://localhost:8000/docs`.

## Module map

| Module | Responsibility |
|---|---|
| `main.py` | FastAPI app, CORS (frontend on a different port), lifespan warms the cache, includes every router. |
| `enums.py` | Strict validation enums. Keys in **English**, mapped to the pt-BR file values in `cleaning`. `Therapy` is **built at import from the cleaning vector**; `City` is validated against the known-cities set. |
| `dtos.py` | Pydantic DTOs: one **query** model per route (pertinent filter subset, all optional) + **response** models for every route (defined even for the not-yet-implemented ones). |
| `cleaning.py` | **The critical layer.** Reads the TSV, normalizes dirty data, exposes the cleaned `DataFrame` (`get_clean_df`) and the **normalized therapies vector** (`therapies_vector`). Reading and cleaning are separate: `build_clean_df(raw)` cleans any raw frame, `read_tabular(bytes)` parses an uploaded CSV/TSV, `REQUIRED_COLUMNS`/`missing_columns` gate it. |
| `uploaded_dataset.py` | The **replaceable** dataset: the uploaded CSV + its own `upload_cache`, versioned. Two backends — in-memory slot, or Blob (one immutable object per upload, newest wins). |
| `blob_storage.py` | The only module that talks to Vercel Blob (official `vercel` SDK, **private** access). Optional: `enabled()` is False without a token and everything falls back to disk/memory. |
| `analytics.py` | Pandas aggregations & crossings. `apply_filters` (the shared filter engine) takes an optional `df`, which is what lets the uploaded dataset reuse every aggregation unchanged. |
| `cache.py` | In-memory cache of aggregates (static data → deterministic per filter combo). `lru_cache` for no-param aggregates; `AggregateCache` dict (keyed via `make_key`) for the rest. |
| `routes/` | **One route per file** for the institute dataset. The uploaded one adds `uploads.py` (lifecycle) and `uploads_analytics.py` (the 10 mirror aggregates, one shared body). |
| `tests/` | pytest, focused on `cleaning`; plus a test per implemented route. |
| `data/` | The provided TSV. |

## Uploaded CSV (`/api/uploads`)

- **The institute routes never move.** `/api/*` always answers from the bundled TSV,
  whatever has been uploaded. That isolation has a test (`test_uploads.py`).
- **Lifecycle** (`routes/uploads.py`): `POST /api/uploads` (multipart, replaces the
  slot), `GET /api/uploads/current` (metadata / 404), `DELETE /api/uploads/current`.
  These are the only non-GET endpoints — CORS allows `GET, POST, DELETE` for them.
- **Rejections are 400 with a pt-BR message the UI shows verbatim**: unsupported
  extension, >10 MB, unreadable file, no data rows, or missing required columns (the
  message lists which).
- **The 10 aggregates are declarations, not implementations**
  (`routes/uploads_analytics.py`): each handler names the filters it forwards (minus
  its own axis, exactly like its `/api` twin) and the aggregation to run;
  `run_on_upload` is the single shared body. No aggregation logic exists twice — the
  reuse point is `apply_filters(df=...)`.
- **Cache**: `upload_cache`, separate from `aggregate_cache`, cleared on replacement
  AND keyed with the dataset `version`, so a new file can never read old numbers.
- **`city` is validated against the UPLOADED file's cities**, in the route (a Pydantic
  field validator cannot know which dataset is loaded) → 422 for an unknown one. The
  `Upload*Query` DTOs therefore mirror their twins with a plain `city` field.
- **Scope**: one dataset for everyone, unauthenticated — the last CSV uploaded wins. To
  make it per-user, key the storage by a session id handed to the browser and thread it
  through the mirror routes; the rest of the design is unaffected.
- **Where it is stored**: in memory (single process) or, with a Blob token, as one
  **immutable** object per upload under `uploads/`. Never overwriting a pathname is what
  keeps the CDN from serving a stale version; "current" is simply the newest object, and
  the version comes from the store's own timestamp so every instance computes the same
  number. Uploading on a serverless host without Blob would appear to work and then lose
  the data on the next request — that is why `main` logs a warning when it detects
  Vercel without a token.

## Storage & environment

Nothing is required to run locally: with no variables set, the TSV comes from disk and
the uploaded CSV lives in memory. The variables exist for hosts that have neither.

| Variable | Effect |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Turns the Blob backend on (`blob_storage.enabled()`). The SDK accepts `VERCEL_BLOB_READ_WRITE_TOKEN` too and does **not** fall back to OIDC — one of them must be in the environment. |
| `INSTITUTE_BLOB_PATH` | Where the institute's TSV lives in the store. |
| `DATA_PATH` | Where the institute's TSV lives on disk. |
| `ALLOWED_ORIGINS` | CORS origins, comma-separated. Irrelevant when the frontend is served from the same domain. |
| `PORT` | HTTP port; hosts usually inject it. |

`backend/.env` is loaded by `main.py` (python-dotenv) for local convenience and is
gitignored. The test suite blanks the Blob variables in `conftest.py` so it never hits
the network; `tests/test_blob_storage.py` opts back in when a real token is present.

**The source is chosen by intent, never by silent fallback.** Setting
`INSTITUTE_BLOB_PATH` means "this file is in Blob": a missing token then raises
`DatasetUnavailable` naming what is absent, instead of reading a disk that (on Vercel)
will never have the file. `main` maps `DatasetUnavailable`/`BlobUnavailable` to **503
with that message**, and the lifespan warm-up never crashes the process — a
configuration mistake must be a readable HTTP answer, and `/api/uploads/*` keeps working
regardless. This exists because the first deploy died with a `FileNotFoundError` deep
inside pandas.

## Conventions

- **Routes**: all `GET` except the upload lifecycle, English paths under `/api`.
- **Enum keys in English**, with the pt-BR mapping living in `cleaning`
  (`SEX_MAP`, `DELIVERY_MAP`, `PARENT_EDUCATION_MAP`, income brackets, therapies, …).
- **Filters are optional query params.** Each route accepts only the **pertinent
  subset** (see its query DTO) and **ignores the parameter of its own axis** — e.g.
  `/api/demographics` does not filter by `sex` because sex is a charted axis. The
  route decides which filters to forward to `apply_filters`.
- **Income is in reais** via `incomeMin` / `incomeMax`. The file stores income as
  "salários mínimos" brackets; `cleaning` translates each bracket to a reais range
  (`income_min` / `income_max`) using `MINIMUM_WAGE`, and `apply_filters` overlap-matches.
- **`city`**: spaces are already URL-decoded by the framework; the value is validated
  strictly against the known-cities set (unknown → 422).
- **`-` means missing** across the file → `None` in the cleaned frame. Apgar averages
  and other means **ignore missing** (never count absent as zero — use
  `mean_ignoring_missing`).

## Single source of truth: therapies

The normalized therapies vector in `cleaning` (`THERAPIES` / `therapies_vector()`) is
the **only** place therapies are defined. It drives:
- the `Therapy` enum (`enums.py`),
- the `therapy` filter validation,
- the `/api/filters/therapies` route.

Truncated/variant spellings (e.g. `Terapia Ocupaciona` → `occupationalTherapy`) are
canonicalized there. If therapies change, edit that vector only.

## Adding a route (the TODO ones)

1. In `analytics.py`, implement the aggregation function (it receives the already
   filtered `DataFrame`; group/count with pandas, return a dict matching the response DTO).
2. In the route file, replace the `raise HTTPException(501)` body: build the cache key
   with `make_key`, call `apply_filters(...)` with the **pertinent filters minus the
   axis**, call the analytics function, wrap in the response DTO, cache via
   `aggregate_cache`.
3. Distribution outputs use the uniform `{label, count}` shape.

## Testing rule (must follow)

**Every new large feature — especially every newly implemented route — must ship with
pytest tests covering that route's aggregate/crossing**, in addition to the existing
`cleaning` tests. Prefer deterministic assertions (pass a fixed `reference_date` to
`clean_df` when age is involved). Do not mark a route done without its test.

`tests/test_uploads.py` covers the uploaded dataset: lifecycle, the three separators,
every mirror aggregate, filters, per-dataset city validation, replacement (including a
deliberately re-injected stale cache entry) and the isolation of the `/api` routes.
