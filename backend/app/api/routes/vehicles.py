"""
NER-RAKSHA Vehicles API — async with demo fallback.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from datetime import datetime, timezone
import logging, random, math

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

_DEMO_VEHICLES = [
    {"id": "V-1001", "name": "Convoy Alpha", "type": "TRUCK", "cargo": "Medical Supplies",
     "priority": "CRITICAL", "status": "MOVING", "speed": 45, "heading": 135,
     "lat": 26.0200, "lon": 91.9500, "is_simulated": True},
    {"id": "V-1002", "name": "Relief Transport 1", "type": "VAN", "cargo": "Food Rations",
     "priority": "IMPORTANT", "status": "AT_RISK", "speed": 12, "heading": 45,
     "lat": 25.7000, "lon": 92.3000, "is_simulated": True},
    {"id": "V-1003", "name": "Ambulance NE-04", "type": "AMBULANCE", "cargo": "Emergency Medical",
     "priority": "CRITICAL", "status": "REROUTING", "speed": 30, "heading": 90,
     "lat": 25.5788, "lon": 91.8933, "is_simulated": True},
    {"id": "V-1004", "name": "Rescue Team 7", "type": "RESCUE", "cargo": "Rescue Equipment",
     "priority": "IMPORTANT", "status": "MOVING", "speed": 55, "heading": 180,
     "lat": 26.3000, "lon": 92.1000, "is_simulated": True},
    {"id": "V-1005", "name": "Supply Truck B", "type": "TRUCK", "cargo": "Blankets & Tents",
     "priority": "NORMAL", "status": "STOPPED", "speed": 0, "heading": 0,
     "lat": 24.8333, "lon": 92.7789, "is_simulated": True},
    {"id": "V-1006", "name": "Aid Van South", "type": "VAN", "cargo": "Water Purifiers",
     "priority": "IMPORTANT", "status": "DELAYED", "speed": 5, "heading": 270,
     "lat": 25.3000, "lon": 92.5000, "is_simulated": False},
]

def _enrich_demo(v: dict) -> dict:
    """Add timestamp and simulate minor position drift."""
    v = v.copy()
    v["last_updated"] = datetime.now(timezone.utc).isoformat()
    if v["status"] == "MOVING":
        v["speed"] = max(20, min(70, v["speed"] + random.randint(-5, 5)))
    return v


@router.get("/")
async def list_vehicles(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_session)
):
    try:
        result = await db.execute(text(
            "SELECT id, name, type, cargo_type as cargo, cargo_priority as priority, "
            "status, current_speed_kmh as speed, heading_deg as heading, is_simulated, updated_at as last_updated "
            "FROM vehicles LIMIT :lim"
        ), {"lim": limit})
        rows = result.mappings().all()
        if rows:
            return {"data": [dict(r) for r in rows], "total": len(rows), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for vehicles: {e}")

    demo = [_enrich_demo(v) for v in _DEMO_VEHICLES]
    return {"data": demo, "total": len(demo), "source": "demo",
            "data_label": "[DEMO DATA — Simulated vehicle fleet]"}


@router.get("/geojson/positions")
async def get_vehicles_geojson(db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text(
            "SELECT id, name, type, status, "
            "ST_X(current_position) as lon, ST_Y(current_position) as lat "
            "FROM vehicles WHERE current_position IS NOT NULL"
        ))
        rows = result.mappings().all()
        if rows:
            return {"type": "FeatureCollection",
                    "features": [{"type": "Feature",
                                  "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
                                  "properties": {"id": r["id"], "name": r["name"], "type": r["type"], "status": r["status"]}}
                                 for r in rows]}
    except Exception as e:
        logger.debug(f"DB unavailable for geojson: {e}")

    return {"type": "FeatureCollection",
            "features": [{"type": "Feature",
                          "geometry": {"type": "Point", "coordinates": [v["lon"], v["lat"]]},
                          "properties": {"id": v["id"], "name": v["name"], "type": v["type"], "status": v["status"]}}
                         for v in _DEMO_VEHICLES]}


@router.get("/{vid}")
async def get_vehicle_detail(vid: str, db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text("SELECT * FROM vehicles WHERE id = :id"), {"id": vid})
        row = result.mappings().first()
        if row:
            return {"data": dict(row), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")

    demo = next((v for v in _DEMO_VEHICLES if v["id"] == vid), None)
    if demo:
        return {"data": _enrich_demo(demo), "source": "demo"}
    return {"error": "Vehicle not found", "id": vid}


@router.post("/{vid}/simulate/{action}")
async def simulate_vehicle(vid: str, action: str, db: AsyncSession = Depends(get_session)):
    status_map = {"start": "MOVING", "pause": "STOPPED", "reset": "STOPPED"}
    new_status = status_map.get(action, "STOPPED")
    try:
        await db.execute(text("UPDATE vehicles SET status = :s WHERE id = :id"), {"s": new_status, "id": vid})
        await db.commit()
        return {"message": f"Simulation {action}ed", "vehicle_id": vid, "new_status": new_status, "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for sim: {e}")
    return {"message": f"[DEMO] Simulation {action}ed", "vehicle_id": vid, "new_status": new_status, "source": "demo"}
