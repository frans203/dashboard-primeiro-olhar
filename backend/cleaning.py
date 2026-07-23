"""Data cleaning / normalization layer.

The raw TSV (``data/Formulario2_Resumido.tsv``) is dirty: mixed formats, ``-`` as
missing, multivalued cells, truncated labels and inconsistent city strings.

This module reads the TSV once and produces a single cleaned ``pandas.DataFrame``
whose columns are normalized (English snake_case) and typed. Every other backend
module (``analytics``, ``routes``) consumes the output of :func:`get_clean_df`.

Reading and cleaning are separate: :func:`build_clean_df` cleans *any* raw frame with
the expected columns, so the same rules serve the bundled TSV (:func:`clean_df`) and a
CSV uploaded at runtime (``uploaded_dataset``), which is read by :func:`read_tabular`.

It also exposes the **normalized therapies vector** (:data:`THERAPIES`) which is the
single source of truth used by the ``Therapy`` enum, the query-param validation and
the ``/api/filters/therapies`` route.

Pandas is used at every step (decision fixed for the project).
"""

from __future__ import annotations

import io
import os
from functools import lru_cache
from typing import Optional

import pandas as pd

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

#: Where the institute's file lives. Overridable with ``DATA_PATH`` because the file is
#: NOT in the repository (personal data — see the root ``.gitignore``): in production it
#: is placed on the host out of band, wherever that host mounts secret files.
TSV_PATH = os.getenv("DATA_PATH") or os.path.join(DATA_DIR, "Formulario2_Resumido.tsv")

#: Sentinel used across the raw file to mean "missing".
MISSING_TOKENS = {"", "-", "–", "—"}

#: Reference Brazilian minimum wage (in reais) used to translate the income
#: brackets (expressed in "salários mínimos") into a numeric reais range so that
#: the ``incomeMin`` / ``incomeMax`` filters (which are in reais) can be applied.
MINIMUM_WAGE = 1412

# --------------------------------------------------------------------------- #
# Normalized therapies vector — SINGLE SOURCE OF TRUTH
# --------------------------------------------------------------------------- #
# Each entry:
#   key      -> english key echoed back as the `therapy` filter value
#   label    -> human readable (pt-BR) label
#   variants -> raw strings found in the file that canonicalize to this therapy
#               (handles truncation, e.g. "Terapia Ocupaciona" == "Terapia Ocupacional")
#
# The ``Therapy`` enum is built from this vector at import time, and
# ``/api/filters/therapies`` serializes ``key``/``label`` pairs from it.
THERAPIES: list[dict] = [
    {"key": "physiotherapy", "label": "Fisioterapia", "variants": {"fisioterapia"}},
    {"key": "speechTherapy", "label": "Fonoaudiologia", "variants": {"fonoaudiologia"}},
    {
        "key": "occupationalTherapy",
        "label": "Terapia Ocupacional",
        # note the truncated variant present in the raw data
        "variants": {"terapia ocupacional", "terapia ocupaciona"},
    },
    {"key": "psychology", "label": "Psicologia", "variants": {"psicologia"}},
    {"key": "psychopedagogy", "label": "Psicopedagogia", "variants": {"psicopedagogia"}},
    {"key": "equineTherapy", "label": "Equoterapia", "variants": {"equoterapia"}},
    {"key": "hydrotherapy", "label": "Hidroterapia", "variants": {"hidroterapia"}},
    {"key": "psychomotricity", "label": "Psicomotricidade", "variants": {"psicomotricidade"}},
    {"key": "padovan", "label": "Padovan", "variants": {"padovan"}},
]

#: Raw multivalued tokens that mean "no therapy" and must NOT be counted.
_NONE_TOKENS = {"nenhuma das opções", "nenhuma das opcoes", "nenhuma"}

# Fast lookup: normalized raw variant -> canonical key
_THERAPY_VARIANT_TO_KEY: dict[str, str] = {
    variant: t["key"] for t in THERAPIES for variant in t["variants"]
}
_THERAPY_KEY_TO_LABEL: dict[str, str] = {t["key"]: t["label"] for t in THERAPIES}


def therapies_vector() -> list[dict]:
    """Return the ``{key, label}`` list (source of truth) — used by the enum,
    validation and the ``/api/filters/therapies`` route."""
    return [{"key": t["key"], "label": t["label"]} for t in THERAPIES]


# --------------------------------------------------------------------------- #
# Disease canonicalization
# --------------------------------------------------------------------------- #
# The raw ``Doencas_Crianca`` column contains commas *inside* labels
# (e.g. "Problema oftálmico (miopia, astigmatismo, ceratocone...)"), which breaks a
# naive comma-split. We canonicalize each exploded fragment against this dictionary;
# fragments that are clearly continuations of a parenthetical list are dropped.
_DISEASE_CANON: dict[str, str] = {
    "cardiopatia": "Cardiopatia",
    "cia (comunicação interatrial": "CIA (Comunicação Interatrial)",
    "cia (comunicação interatrial)": "CIA (Comunicação Interatrial)",
    "cia (comunicação interatrial) - forame oval": "CIA (Comunicação Interatrial) - Forame Oval",
    "civ (comunicação interventricular)": "CIV (Comunicação Interventricular)",
    "defeito de septo atrioventricular (dsav)": "Defeito de Septo Atrioventricular (DSAV)",
    "pca (persistência do canal arterial)": "PCA (Persistência do Canal Arterial)",
    "hipertensão pulmonar": "Hipertensão Pulmonar",
    "tetralogia de fallot": "Tetralogia de Fallot",
    "hipotireoidismo pós- natal (após o nascimento)": "Hipotireoidismo pós-natal",
    "hipotireoidismo pós - natal (após o nascimento)": "Hipotireoidismo pós-natal",
    "hipotireoidismo congênito (ao nascimento)": "Hipotireoidismo congênito",
    "alergias": "Alergias",
    "asma": "Asma",
    "problema auditivo": "Problema auditivo",
    "problema oftálmico (miopia": "Problema oftálmico",
    "doença de hirschsprung": "Doença de Hirschsprung",
    "pneumonias recorrentes": "Pneumonias recorrentes",
}
#: Exploded fragments that are just the tail of a parenthetical enumeration.
_DISEASE_DROP = {"astigmatismo", "ceratocone...)", "ceratocone...", "ceratocone"}
_DISEASE_NONE = {"nenhuma das opções", "nenhuma das opcoes"}


# --------------------------------------------------------------------------- #
# Categorical value maps (pt-BR raw -> english key)
# --------------------------------------------------------------------------- #

SEX_MAP = {"masculino": "male", "feminino": "female"}
DELIVERY_MAP = {"cesárea": "cesarean", "cesarea": "cesarean", "normal": "vaginal"}
PARENT_EDUCATION_MAP = {
    "não alfabetizada": "notLiterate",
    "não alfabetizado": "notLiterate",
    "ensino fundamental": "elementary",
    "ensino médio": "highSchool",
    "ensino superior incompleto": "higherIncomplete",
    "ensino superior completo": "higherComplete",
    "pós-graduada": "postgraduate",
    "pós-graduado": "postgraduate",
}
MARITAL_MAP = {
    "casada": "married",
    "casado": "married",
    "solteira": "single",
    "solteiro": "single",
    "em união estável": "stableUnion",
    "divorciada": "divorced",
    "divorciado": "divorced",
    "viúva": "widowed",
    "viúvo": "widowed",
}

#: Income brackets -> reais range (open top for the highest bracket).
#: ``order`` gives a stable low-to-high ordering for charts.
INCOME_BRACKETS: list[dict] = [
    {
        "label": "Menos de 1 salário mínimo",
        "raw": {"menos de 1 salário mínimo.", "menos de 1 salário mínimo"},
        "min": 0,
        "max": MINIMUM_WAGE,
        "order": 0,
    },
    {
        "label": "1 a 3 salários mínimos",
        "raw": {"entre 01 a 03 salários mínimos.", "entre 01 a 03 salários mínimos"},
        "min": MINIMUM_WAGE,
        "max": 3 * MINIMUM_WAGE,
        "order": 1,
    },
    {
        "label": "3 a 6 salários mínimos",
        "raw": {"entre 03 a 06 salários mínimos.", "entre 03 a 06 salários mínimos"},
        "min": 3 * MINIMUM_WAGE,
        "max": 6 * MINIMUM_WAGE,
        "order": 2,
    },
    {
        "label": "6 a 10 salários mínimos",
        "raw": {"entre 06 a 10 salários mínimos.", "entre 06 a 10 salários mínimos"},
        "min": 6 * MINIMUM_WAGE,
        "max": 10 * MINIMUM_WAGE,
        "order": 3,
    },
    {
        "label": "Mais de 10 salários mínimos",
        "raw": {"mais de 10 salários mínimos.", "mais de 10 salários mínimos"},
        "min": 10 * MINIMUM_WAGE,
        "max": 500_000,  # open top
        "order": 4,
    },
]
_INCOME_RAW_TO_BRACKET = {raw: b for b in INCOME_BRACKETS for raw in b["raw"]}

#: Two-letter Brazilian state siglas, for stripping "City, PE" style suffixes.
_BR_STATES = {
    "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms",
    "mg", "pa", "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc",
    "sp", "se", "to",
}
#: City tokens that are not identifiable cities -> "Não informado".
_CITY_UNKNOWN = {"brasil", "-", ""}


# --------------------------------------------------------------------------- #
# Scalar cleaners
# --------------------------------------------------------------------------- #


def is_missing(value) -> bool:
    """True when a raw cell should be treated as missing."""
    if value is None:
        return True
    if isinstance(value, float) and pd.isna(value):
        return True
    return str(value).strip() in MISSING_TOKENS


def clean_str(value) -> Optional[str]:
    """Trim and convert missing tokens to ``None``."""
    if is_missing(value):
        return None
    return str(value).strip()


def clean_apgar(value) -> Optional[int]:
    """Normalize an Apgar cell.

    Handles ``9`` and ``09`` (leading zero) as the same value, ``-`` as missing,
    and the occasional decimal (``9.5`` -> rounded to nearest int). Returns
    ``None`` for missing so that averages *ignore* absent scores (never count as 0).
    """
    if is_missing(value):
        return None
    text = str(value).strip()
    try:
        # int() would choke on "09"? No — int("09") == 9. But decimals need float.
        return int(round(float(text)))
    except (ValueError, TypeError):
        return None


def clean_bool(value) -> Optional[bool]:
    """Map ``Sim``/``Não`` (and missing) to bool / None."""
    if is_missing(value):
        return None
    text = str(value).strip().lower()
    if text in {"sim", "yes", "true"}:
        return True
    if text in {"não", "nao", "no", "false"}:
        return False
    return None


def normalize_city(value) -> tuple[Optional[str], Optional[str]]:
    """Return ``(city, state)``.

    - Unidentified values (``Brasil``, ``-``) collapse to ``"Não informado"``.
    - A trailing state sigla is split off (``Recife, PE`` -> city ``Recife``,
      state ``PE``) so the city label is clean while the state is preserved.
    """
    if is_missing(value):
        return "Não informado", None
    text = str(value).strip()
    if text.lower() in _CITY_UNKNOWN:
        return "Não informado", None

    state: Optional[str] = None
    # Split on comma or dash first: "Recife, PE" / "Picos - PI"
    for sep in (",", " - ", "-"):
        if sep in text:
            head, _, tail = text.partition(sep)
            tail_token = tail.strip().lower()
            if tail_token in _BR_STATES:
                state = tail_token.upper()
                text = head.strip()
            break
    # Trailing space-separated sigla: "Gramado RS"
    parts = text.split()
    if len(parts) >= 2 and parts[-1].lower() in _BR_STATES:
        state = parts[-1].upper()
        text = " ".join(parts[:-1]).strip()

    # Title-case for consistent grouping ("ITAPOROROCA" -> "Itapororoca")
    city = _titlecase_city(text)
    return city, state


_CITY_LOWER_WORDS = {"de", "do", "da", "dos", "das", "e"}


def _titlecase_city(text: str) -> str:
    words = text.split()
    out = []
    for i, w in enumerate(words):
        lw = w.lower()
        if i > 0 and lw in _CITY_LOWER_WORDS:
            out.append(lw)
        else:
            out.append(lw.capitalize())
    return " ".join(out)


def split_multivalue(value) -> list[str]:
    """Split a comma-separated cell into trimmed, non-empty fragments."""
    if is_missing(value):
        return []
    return [p.strip() for p in str(value).split(",") if p.strip()]


def canonicalize_therapies(value) -> list[str]:
    """Explode a raw ``Terapias`` cell into a list of canonical therapy **keys**.

    Truncated / variant spellings are unified; "Nenhuma das opções" yields ``[]``.
    """
    keys: list[str] = []
    for frag in split_multivalue(value):
        norm = frag.strip().lower()
        if norm in _NONE_TOKENS:
            continue
        key = _THERAPY_VARIANT_TO_KEY.get(norm)
        if key and key not in keys:
            keys.append(key)
    return keys


def canonicalize_diseases(value) -> list[str]:
    """Explode a raw ``Doencas_Crianca`` cell into canonical disease labels.

    Fragments that are tails of a parenthetical enumeration are dropped; unknown
    fragments are kept verbatim (trimmed) so nothing is silently lost.
    """
    labels: list[str] = []
    for frag in split_multivalue(value):
        norm = frag.strip().lower()
        if norm in _DISEASE_NONE or norm in _DISEASE_DROP:
            continue
        label = _DISEASE_CANON.get(norm, frag.strip())
        if label not in labels:
            labels.append(label)
    return labels


def parse_birthdate(value) -> Optional[pd.Timestamp]:
    """Parse a ``DD/MM/YYYY`` birthdate; missing/invalid -> ``NaT`` -> None."""
    if is_missing(value):
        return None
    ts = pd.to_datetime(str(value).strip(), dayfirst=True, errors="coerce")
    return None if pd.isna(ts) else ts


def _income_bracket(value) -> Optional[dict]:
    if is_missing(value):
        return None
    return _INCOME_RAW_TO_BRACKET.get(str(value).strip().lower())


# --------------------------------------------------------------------------- #
# DataFrame builder
# --------------------------------------------------------------------------- #


class DatasetUnavailable(RuntimeError):
    """The institute's file cannot be loaded — with a message that says what to fix.

    ``main`` maps it to a 503, so a misconfigured deploy answers "here is what is
    missing" on every ``/api/*`` request instead of killing the process at startup.
    The ``/api/uploads/*`` routes are unaffected: they never touch this file.
    """


def load_raw_df() -> pd.DataFrame:
    """Read the institute's raw file as strings (no type inference).

    The source is chosen by INTENT, never by silent fallback: setting
    ``INSTITUTE_BLOB_PATH`` means "this file lives in Blob", so a missing token is an
    error to report, not a reason to look at a disk that (on Vercel) will never have
    the file.
    """
    import blob_storage  # local import: keeps ``cleaning`` importable without the SDK

    path = blob_storage.institute_path()
    if path:
        if not blob_storage.enabled():
            raise DatasetUnavailable(
                f"INSTITUTE_BLOB_PATH está definido ({path}), mas falta o token do "
                "Blob. Conecte o store ao projeto (isso injeta BLOB_READ_WRITE_TOKEN) "
                "e refaça o deploy — variáveis novas não valem para deploys antigos."
            )
        return read_tabular(blob_storage.read(path), path)

    if not os.path.exists(TSV_PATH):
        # The advice differs by environment: on a serverless host the disk is not an
        # option at all, while locally putting the file in place IS the fix.
        if blob_storage.on_vercel():
            raise DatasetUnavailable(
                "Na Vercel não existe disco persistente, e INSTITUTE_BLOB_PATH não foi "
                "definido. Suba o TSV do Instituto para o Blob store e aponte "
                "INSTITUTE_BLOB_PATH para o caminho dele."
            )
        raise DatasetUnavailable(
            f"O arquivo do Instituto não foi encontrado em {TSV_PATH}. Coloque o TSV "
            "nesse caminho (ele não é versionado — peça a quem já trabalha no projeto) "
            "ou aponte DATA_PATH para onde ele está. A tela 'Analisar CSV' funciona "
            "sem ele."
        )

    return pd.read_csv(TSV_PATH, sep="\t", dtype=str, keep_default_na=False)


#: Raw columns :func:`build_clean_df` reads. A file missing any of them cannot be
#: cleaned, so uploads are rejected with the list of what is absent.
REQUIRED_COLUMNS: list[str] = [
    "Nome_Crianca",
    "Data_Nascimento_Crianca",
    "Sexo_Crianca",
    "Cidade_Nascimento_Crianca",
    "Maternidade",
    "Apgar_1min",
    "Apgar_5min",
    "UTI_Nascimento",
    "Intercorrencia_Neonatal",
    "Internacao_Nascimento",
    "Cirurgia_Cardiaca",
    "Descoberta_T21",
    "Terapias",
    "Doencas_Crianca",
    "Grau_Escolaridade_Mae",
    "Grau_Escolaridade_Pai",
    "Estado_Civil_Mae",
    "Estado_Civil_Pai",
    "Renda_Familiar",
    "Total_Pessoas_Casa",
    "Total_Contribuintes_Renda",
    "BPC",
    "Auxilio_Governo",
    "Tipo_Parto",
]

#: Separators tried, in order, when sniffing an uploaded file.
_SEPARATORS = ["\t", ",", ";"]


def missing_columns(raw: pd.DataFrame) -> list[str]:
    """Required columns absent from ``raw``, in the canonical order."""
    present = set(raw.columns)
    return [c for c in REQUIRED_COLUMNS if c not in present]


def _decode(content: bytes) -> str:
    """Decode an uploaded file: UTF-8 (BOM-aware) with a latin-1 fallback."""
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    # latin-1 maps every byte, so this is unreachable in practice.
    return content.decode("utf-8", errors="replace")


def read_tabular(content: bytes, filename: str = "") -> pd.DataFrame:
    """Parse uploaded CSV/TSV bytes into a raw string DataFrame.

    Same contract as :func:`load_raw_df` (``dtype=str``, no NA inference) so the
    cleaning rules behave identically. The separator is sniffed: whichever of tab,
    comma or semicolon yields the most required columns wins — a plain header count
    would be fooled by a one-column parse of the wrong separator.
    """
    text = _decode(content)
    if not text.strip():
        raise ValueError("O arquivo está vazio.")

    best: Optional[pd.DataFrame] = None
    best_score = -1
    for sep in _SEPARATORS:
        try:
            candidate = pd.read_csv(
                io.StringIO(text), sep=sep, dtype=str, keep_default_na=False
            )
        except (pd.errors.ParserError, ValueError):
            continue
        score = len(REQUIRED_COLUMNS) - len(missing_columns(candidate))
        if score > best_score:
            best, best_score = candidate, score

    if best is None:
        raise ValueError(
            f"Não foi possível ler o arquivo{f' {filename}' if filename else ''} "
            "como CSV/TSV."
        )
    return best


def _compute_age(birth: Optional[pd.Timestamp], reference: pd.Timestamp) -> Optional[int]:
    if birth is None:
        return None
    years = reference.year - birth.year
    if (reference.month, reference.day) < (birth.month, birth.day):
        years -= 1
    return years if years >= 0 else None


def clean_df(reference_date: Optional[pd.Timestamp] = None) -> pd.DataFrame:
    """Build the cleaned DataFrame for the bundled TSV.

    ``reference_date`` is the "today" used to compute the child's age; defaults to
    :func:`pandas.Timestamp.today`. Passing it explicitly keeps tests deterministic.
    """
    return build_clean_df(load_raw_df(), reference_date)


def build_clean_df(
    raw: pd.DataFrame, reference_date: Optional[pd.Timestamp] = None
) -> pd.DataFrame:
    """Clean an already-read raw frame (the bundled TSV or an uploaded CSV).

    ``raw`` must carry :data:`REQUIRED_COLUMNS` — check with :func:`missing_columns`
    first; a missing column raises ``KeyError`` here.
    """
    ref = reference_date if reference_date is not None else pd.Timestamp.today().normalize()

    df = pd.DataFrame()

    # identity
    df["name"] = raw["Nome_Crianca"].map(clean_str)

    # child birthdate + age
    birth = raw["Data_Nascimento_Crianca"].map(parse_birthdate)
    df["birthdate"] = birth
    df["age"] = birth.map(lambda b: _compute_age(b, ref))

    # categoricals -> english keys
    df["sex"] = raw["Sexo_Crianca"].map(lambda v: SEX_MAP.get((clean_str(v) or "").lower()))
    df["delivery_type"] = raw["Tipo_Parto"].map(
        lambda v: DELIVERY_MAP.get((clean_str(v) or "").lower())
    )

    # city / state
    city_state = raw["Cidade_Nascimento_Crianca"].map(normalize_city)
    df["city"] = city_state.map(lambda t: t[0])
    df["state"] = city_state.map(lambda t: t[1])

    # maternity (free text, just trimmed)
    df["maternity"] = raw["Maternidade"].map(clean_str)

    # apgar
    df["apgar_1min"] = raw["Apgar_1min"].map(clean_apgar)
    df["apgar_5min"] = raw["Apgar_5min"].map(clean_apgar)

    # neonatal flags
    df["nicu"] = raw["UTI_Nascimento"].map(clean_bool)
    df["neonatal_complication"] = raw["Intercorrencia_Neonatal"].map(clean_bool)
    df["hospitalized_at_birth"] = raw["Internacao_Nascimento"].map(clean_bool)
    df["cardiac_surgery"] = raw["Cirurgia_Cardiaca"].map(clean_bool)

    # diagnosis moment
    df["diagnosis_moment"] = raw["Descoberta_T21"].map(clean_str)

    # multivalued
    df["therapies"] = raw["Terapias"].map(canonicalize_therapies)
    df["diseases"] = raw["Doencas_Crianca"].map(canonicalize_diseases)

    # parents
    df["mother_education"] = raw["Grau_Escolaridade_Mae"].map(
        lambda v: PARENT_EDUCATION_MAP.get((clean_str(v) or "").lower())
    )
    df["father_education"] = raw["Grau_Escolaridade_Pai"].map(
        lambda v: PARENT_EDUCATION_MAP.get((clean_str(v) or "").lower())
    )
    df["mother_marital_status"] = raw["Estado_Civil_Mae"].map(
        lambda v: MARITAL_MAP.get((clean_str(v) or "").lower())
    )
    df["father_marital_status"] = raw["Estado_Civil_Pai"].map(
        lambda v: MARITAL_MAP.get((clean_str(v) or "").lower())
    )

    # income (bracket + numeric range in reais)
    bracket = raw["Renda_Familiar"].map(_income_bracket)
    df["income_label"] = bracket.map(lambda b: b["label"] if b else None)
    df["income_order"] = bracket.map(lambda b: b["order"] if b else None)
    df["income_min"] = bracket.map(lambda b: b["min"] if b else None)
    df["income_max"] = bracket.map(lambda b: b["max"] if b else None)

    # household + benefits
    df["household_size"] = raw["Total_Pessoas_Casa"].map(clean_str)
    df["income_contributors"] = raw["Total_Contribuintes_Renda"].map(clean_str)
    df["bpc"] = raw["BPC"].map(clean_bool)
    df["government_aid"] = raw["Auxilio_Governo"].map(clean_bool)

    return df


# --------------------------------------------------------------------------- #
# Cached accessor
# --------------------------------------------------------------------------- #


@lru_cache(maxsize=1)
def get_clean_df() -> pd.DataFrame:
    """Process-wide cached cleaned DataFrame (data is static)."""
    return clean_df()
