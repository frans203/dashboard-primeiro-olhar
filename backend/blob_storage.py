"""Vercel Blob — the disk the serverless runtime does not give us.

On Vercel there is no persistent disk and no shared memory: each request may be served
by a fresh copy of the app. Two things therefore cannot live in the process:

* the institute's TSV (not in the repository — personal data — and too big for an
  environment variable: 203 KB against a 64 KB limit);
* the uploaded CSV (today a single in-memory slot).

Both move to a **private** Blob store (reads require the token, so the children's data
is never on a public URL). This module is the only place that talks to it.

**It is optional.** With no ``BLOB_READ_WRITE_TOKEN`` in the environment — local
development, the test suite, any host with a real disk — :func:`enabled` is False and
the callers keep their disk/memory behaviour. That is why every read of the environment
here happens at call time, never at import.
"""

from __future__ import annotations

import os
from typing import Optional

import vercel.blob as blob
from vercel.blob.errors import BlobError

#: Blobs are written (and read) with private access; the store must be private too.
_ACCESS = "private"

#: Where the uploaded CSVs live inside the store. One immutable blob per upload.
UPLOADS_PREFIX = "uploads/"


class BlobUnavailable(RuntimeError):
    """The Blob store could not be reached, or the object is not there."""


def enabled() -> bool:
    """True when a Blob token is configured — i.e. storage is Blob-backed."""
    return bool(os.getenv("BLOB_READ_WRITE_TOKEN"))


def institute_path() -> Optional[str]:
    """Pathname of the institute's TSV inside the store (``INSTITUTE_BLOB_PATH``)."""
    path = os.getenv("INSTITUTE_BLOB_PATH")
    return path.strip() or None if path else None


def read(pathname: str, *, use_cache: bool = True) -> bytes:
    """Download a blob's bytes.

    ``use_cache=False`` bypasses the CDN and reads from origin — only needed right
    after writing to the *same* pathname, which this app avoids by design (every
    upload gets a unique name).
    """
    try:
        result = blob.get(pathname, access=_ACCESS, use_cache=use_cache)
    except BlobError as exc:
        raise BlobUnavailable(f"Falha ao ler {pathname!r} do Blob: {exc}") from exc
    if result.status_code != 200 or result.content is None:
        raise BlobUnavailable(f"Blob {pathname!r} não encontrado (HTTP {result.status_code}).")
    return result.content


def write(pathname: str, data: bytes, *, content_type: str = "text/csv") -> str:
    """Upload bytes and return the blob's pathname.

    Never overwrites: callers generate a unique pathname per write, which sidesteps
    the CDN propagation window that overwriting the same name would open.
    """
    try:
        result = blob.put(pathname, data, access=_ACCESS, content_type=content_type)
    except BlobError as exc:
        raise BlobUnavailable(f"Falha ao gravar {pathname!r} no Blob: {exc}") from exc
    return result.pathname


def list_uploads() -> list:
    """Every uploaded CSV in the store, newest first."""
    try:
        result = blob.list_objects(prefix=UPLOADS_PREFIX)
    except BlobError as exc:
        raise BlobUnavailable(f"Falha ao listar uploads no Blob: {exc}") from exc
    return sorted(result.blobs, key=lambda item: item.uploaded_at, reverse=True)


def delete(pathnames: list[str]) -> None:
    """Remove blobs (no-op for an empty list)."""
    if not pathnames:
        return
    try:
        blob.delete(pathnames)
    except BlobError as exc:
        raise BlobUnavailable(f"Falha ao apagar blobs: {exc}") from exc
