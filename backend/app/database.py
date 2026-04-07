import os
import ssl as _ssl

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

# ─── Dual-mode: PostgreSQL (Supabase) when DATABASE_URL is set, else SQLite ───
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Convert postgresql:// to postgresql+asyncpg:// for async support
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

    # Supabase requires SSL
    ssl_ctx = _ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = _ssl.CERT_NONE

    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        poolclass=NullPool,  # Serverless: no persistent pool
        connect_args={
            "ssl": ssl_ctx,
            "server_settings": {"jit": "off"},  # Faster cold starts
            "statement_cache_size": 0,  # Disable prepared statement cache
        },
    )
    timescale_engine = engine
    IS_POSTGRES = True
else:
    # Local development fallback: SQLite
    if os.environ.get("VERCEL"):
        DB_PATH = "/tmp/insite.db"
    else:
        DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "insite.db")

    SQLITE_URL = f"sqlite+aiosqlite:///{DB_PATH}"
    engine = create_async_engine(SQLITE_URL, echo=False)
    timescale_engine = create_async_engine(SQLITE_URL, echo=False)
    IS_POSTGRES = False

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
TimescaleSessionLocal = async_sessionmaker(
    timescale_engine, class_=AsyncSession, expire_on_commit=False
)


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
