"""Upload lifecycle: POST a CSV, read its status, drop it.

``POST /api/uploads`` replaces the single uploaded-dataset slot (see
:mod:`uploaded_dataset`); the aggregates over it are served by the mirror routes in
:mod:`routes.uploads_analytics`.

This is the only non-GET surface in the service, so the rules it enforces are here:
extension, size and parseability, plus the required-column check that lives in
``cleaning``. Every rejection returns 400 with a pt-BR message the UI shows verbatim.
"""

import os
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from cleaning import read_tabular
from dtos import UploadStatusResponse
from uploaded_dataset import (
    DatasetError,
    UploadedDataset,
    clear_uploaded,
    get_uploaded,
    set_uploaded,
)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

#: Uploads are read fully into memory, so cap them. The institute's own file is ~200 KB.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".tsv", ".txt"}


def _to_status(dataset: UploadedDataset) -> UploadStatusResponse:
    return UploadStatusResponse(
        filename=dataset.filename,
        rowCount=dataset.row_count,
        uploadedAt=dataset.uploaded_at.isoformat(),
        version=dataset.version,
        warnings=dataset.warnings,
    )


@router.post("", response_model=UploadStatusResponse)
async def upload_dataset(
    file: Annotated[UploadFile, File(description="CSV/TSV no formato do formulário")],
) -> UploadStatusResponse:
    filename = file.filename or "arquivo.csv"
    extension = os.path.splitext(filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Formato não suportado. Envie um arquivo .csv, .tsv ou .txt.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande (máximo {MAX_UPLOAD_BYTES // (1024 * 1024)} MB).",
        )

    try:
        raw = read_tabular(content, filename)
        dataset = set_uploaded(raw, filename)
    except DatasetError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:  # unreadable / empty file from ``read_tabular``
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _to_status(dataset)


@router.get("/current", response_model=UploadStatusResponse)
def current_dataset() -> UploadStatusResponse:
    """Metadata of the loaded CSV — lets the UI recover its state after a reload."""
    dataset = get_uploaded()
    if dataset is None:
        raise HTTPException(status_code=404, detail="Nenhum CSV enviado.")
    return _to_status(dataset)


@router.delete("/current", status_code=204)
def delete_dataset() -> None:
    clear_uploaded()
