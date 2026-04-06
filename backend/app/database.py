import os

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# Use /tmp for Vercel serverless (read-only filesystem except /tmp)
if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/insite.db"
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "insite.db")

SQLITE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(SQLITE_URL, echo=False)
timescale_engine = create_async_engine(SQLITE_URL, echo=False)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
TimescaleSessionLocal = async_sessionmaker(timescale_engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class TimescaleBase(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def get_timescale_db() -> AsyncSession:
    async with TimescaleSessionLocal() as session:
        yield session
