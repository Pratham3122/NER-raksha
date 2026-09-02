from fastapi import APIRouter
from sqlalchemy import text
from app.database import engine, check_db_connection, check_postgis
from app.config import settings
import httpx
import time
import logging

router = APIRouter(prefix='/api/system', tags=['System Health'])

@router.get('/health')
async def get_system_health():
    """
    Comprehensive health check of all system components.
    Returns actual status based on real checks.
    """
    components = {}
    overall = 'ONLINE'
    
    # Database check
    t0 = time.time()
    db_ok = await check_db_connection()
    db_latency = int((time.time() - t0) * 1000)
    postgis_ok = await check_postgis() if db_ok else False
    components['database'] = {
        'status': 'ONLINE' if db_ok else 'OFFLINE',
        'message': f'PostgreSQL + PostGIS {"OK" if postgis_ok else "(PostGIS unavailable)"}',
        'latency_ms': db_latency,
    }
    
    # Routing engine check
    routing_status = 'ONLINE'
    routing_msg = f'Mode: {settings.routing_mode}'
    if settings.routing_mode == 'osrm':
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f'{settings.osrm_url}/route/v1/driving/91.7362,26.1445;91.8000,26.2000?overview=false')
            routing_status = 'ONLINE' if resp.status_code == 200 else 'DEGRADED'
        except Exception:
            routing_status = 'DEGRADED'
            routing_msg = 'OSRM unreachable, using DEMO routing'
    else:
        routing_msg = 'DEMO routing active'
    components['routing'] = {'status': routing_status, 'message': routing_msg}
    
    # GIS check (PostGIS spatial functions)
    try:
        from app.database import engine as eng
        async with eng.connect() as conn:
            await conn.execute(text("SELECT ST_MakePoint(91.7, 26.1)"))
        components['gis'] = {'status': 'ONLINE', 'message': 'PostGIS spatial functions OK'}
    except Exception:
        components['gis'] = {'status': 'OFFLINE', 'message': 'GIS unavailable'}
    
    # ML model check
    try:
        import joblib
        import os
        ml_path = settings.ml_model_path
        if os.path.exists(ml_path):
            model = joblib.load(ml_path)
            components['ml'] = {'status': 'ONLINE', 'message': f'Model loaded: {ml_path}'}
        else:
            components['ml'] = {'status': 'DEGRADED', 'message': 'Model file not found - run training script'}
    except Exception as e:
        components['ml'] = {'status': 'DEGRADED', 'message': str(e)}
    
    # Alert engine (always active if DB is OK)
    components['alert_engine'] = {
        'status': 'ONLINE' if db_ok else 'OFFLINE',
        'message': 'Alert deduplication active',
    }
    
    # GPS Simulator
    components['gps_simulator'] = {
        'status': 'ONLINE',
        'message': 'SIMULATED - No physical GPS hardware required',
    }
    
    # API itself
    components['api'] = {
        'status': 'ONLINE',
        'message': f'FastAPI v0.111 | NER-RAKSHA {settings.app_version}',
        'latency_ms': 0,
    }
    
    # Determine overall
    statuses = [c['status'] for c in components.values()]
    if 'OFFLINE' in statuses:
        overall = 'DEGRADED' if components['database']['status'] == 'ONLINE' else 'OFFLINE'
    elif 'DEGRADED' in statuses:
        overall = 'DEGRADED'
    
    from datetime import datetime, timezone
    return {
        'overall': overall,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'data_mode': settings.data_mode.upper(),
        'version': settings.app_version,
        'components': components,
    }
