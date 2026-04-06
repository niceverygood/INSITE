from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func

from app.config import get_settings
from app.api.v1 import assets, metrics, alerts, logs, dashboard, reports, ai_diagnosis, auth
import app.models  # noqa: F401

settings = get_settings()


async def _auto_seed():
    """Seed demo data if the database is empty (e.g., Vercel cold start)."""
    from app.database import AsyncSessionLocal
    from app.models.user import User

    async with AsyncSessionLocal() as db:
        count = await db.execute(select(func.count(User.id)))
        if count.scalar() > 0:
            return  # Already seeded

    import logging, os
    logger = logging.getLogger(__name__)
    logger.info("Empty database detected — seeding demo data...")

    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

    if os.environ.get("VERCEL"):
        # Lightweight seed for serverless cold start (~2s)
        from seed_lite import seed_lite
        await seed_lite()
    else:
        from seed_data import seed
        await seed(skip_create_tables=True)

    logger.info("Demo data seeded successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import engine, timescale_engine, Base, TimescaleBase
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with timescale_engine.begin() as conn:
        await conn.run_sync(TimescaleBase.metadata.create_all)
    await _auto_seed()
    yield


app = FastAPI(
    title="INSITE API",
    description="IT Infrastructure Integrated Monitoring System",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(assets.router, prefix="/api/v1/assets", tags=["Assets"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["Metrics"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(logs.router, prefix="/api/v1/logs", tags=["Logs"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(ai_diagnosis.router, prefix="/api/v1/ai", tags=["AI Diagnosis"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "INSITE"}
