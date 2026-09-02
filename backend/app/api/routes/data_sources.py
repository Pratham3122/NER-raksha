from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from app.config import settings
from datetime import datetime, timezone

router = APIRouter(prefix='/api/data-sources', tags=['Data Sources'])

@router.get('/')
async def get_data_sources(db: AsyncSession = Depends(get_session)):
    """Returns all registered data sources and their current status."""
    result = await db.execute(text("""
        SELECT id, name, dataset, url, status, last_checked, last_updated,
               mode, coverage, refresh_interval, notes, is_active
        FROM data_sources
        WHERE is_active = true
        ORDER BY name
    """))
    sources = result.fetchall()
    return {
        'sources': [
            {
                'id': s.id, 'name': s.name, 'dataset': s.dataset,
                'url': s.url, 'status': s.status,
                'last_checked': s.last_checked.isoformat() if s.last_checked else None,
                'last_updated': s.last_updated.isoformat() if s.last_updated else None,
                'mode': s.mode, 'coverage': s.coverage,
                'refresh_interval': s.refresh_interval, 'notes': s.notes,
            }
            for s in sources
        ],
        'data_mode': settings.data_mode.upper(),
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
