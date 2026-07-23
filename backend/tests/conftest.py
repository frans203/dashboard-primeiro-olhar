"""Make backend modules importable regardless of pytest's working directory.

Also pins the storage backend: the suite must exercise the in-memory/disk path and
never touch the network, so the Blob token is cleared before anything imports. The
Blob path has its own opt-in suite (``test_blob_storage.py``), which skips unless a
token is present.
"""

import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Set to empty rather than deleted: ``main`` calls ``load_dotenv``, which fills in any
# variable that is ABSENT from the environment (it never overrides one that is present).
# An empty value is present — so it survives, and ``blob_storage.enabled()`` stays False.
os.environ["BLOB_READ_WRITE_TOKEN"] = ""
os.environ["INSTITUTE_BLOB_PATH"] = ""
