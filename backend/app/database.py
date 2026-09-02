from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def check_db_connection() -> bool:
    import asyncio
    try:
        async def _check():
            async with engine.connect() as conn:
                await conn.execute(text('SELECT 1'))
            return True
        return await asyncio.wait_for(_check(), timeout=2.0)
    except Exception as e:
        logger.error(f'DB connection failed: {e}')
        return False

async def check_postgis() -> bool:
    import asyncio
    try:
        async def _check():
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT PostGIS_version()"))
                return result.fetchone() is not None
        return await asyncio.wait_for(_check(), timeout=2.0)
    except Exception:
        return False
