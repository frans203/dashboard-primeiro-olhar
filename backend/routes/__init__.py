"""Route registry.

Each route lives in its own module and exposes an ``APIRouter`` named ``router``.
``all_routers`` is imported by ``main.py`` and included in the FastAPI app.
"""

from routes import (
    crossings_bpc_income,
    crossings_delivery_complications,
    crossings_income_therapies,
    demographics,
    diagnosis,
    filters_therapies,
    health,
    indicators,
    neonatal,
    socioeconomic,
    therapies,
    uploads,
    uploads_analytics,
)

all_routers = [
    filters_therapies.router,  # implemented
    demographics.router,
    neonatal.router,
    diagnosis.router,
    health.router,
    therapies.router,
    socioeconomic.router,
    crossings_income_therapies.router,
    crossings_delivery_complications.router,
    crossings_bpc_income.router,
    indicators.router,
    # Uploaded CSV: lifecycle + the same aggregates over the replaceable dataset.
    uploads.router,
    uploads_analytics.router,
]
