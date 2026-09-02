"""
NER-RAKSHA Roads API
Returns road network data — live from DB or demo fallback.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from app.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/roads", tags=["Roads"])

# ── Demo data (Northeast India realistic synthetic segments) ──────────────────
DEMO_ROADS = [
    {"id": "RS-001", "name": "NH-37 Kaziranga Segment", "road_class": "NH", "district": "Golaghat",
     "status": "BLOCKED", "risk_score": 95.0, "risk_level": "CRITICAL", "condition": "VERY_POOR",
     "length_km": 48.2, "is_demo": True},
    {"id": "RS-002", "name": "NH-27 Assam Valley", "road_class": "NH", "district": "Bongaigaon",
     "status": "OPEN", "risk_score": 12.0, "risk_level": "LOW", "condition": "GOOD",
     "length_km": 112.5, "is_demo": True},
    {"id": "RS-003", "name": "NH-6 Barak Valley", "road_class": "NH", "district": "Cachar",
     "status": "AT_RISK", "risk_score": 68.0, "risk_level": "HIGH", "condition": "POOR",
     "length_km": 76.3, "is_demo": True},
    {"id": "RS-004", "name": "SH-5 Shillong Bypass", "road_class": "SH", "district": "East Khasi Hills",
     "status": "AT_RISK", "risk_score": 54.0, "risk_level": "MEDIUM", "condition": "FAIR",
     "length_km": 23.7, "is_demo": True},
    {"id": "RS-005", "name": "NH-2 Guwahati-Meghalaya", "road_class": "NH", "district": "Kamrup",
     "status": "OPEN", "risk_score": 22.0, "risk_level": "LOW", "condition": "GOOD",
     "length_km": 89.1, "is_demo": True},
    {"id": "RS-006", "name": "NH-54 Silchar Highway", "road_class": "NH", "district": "Hailakandi",
     "status": "SEVERELY_DISRUPTED", "risk_score": 81.0, "risk_level": "CRITICAL", "condition": "VERY_POOR",
     "length_km": 134.6, "is_demo": True},
    {"id": "RS-007", "name": "Imphal Ring Road", "road_class": "SH", "district": "Imphal West",
     "status": "OPEN", "risk_score": 15.0, "risk_level": "LOW", "condition": "FAIR",
     "length_km": 31.2, "is_demo": True},
    {"id": "RS-008", "name": "NH-29 Dimapur-Kohima", "road_class": "NH", "district": "Dimapur",
     "status": "AT_RISK", "risk_score": 47.0, "risk_level": "MEDIUM", "condition": "POOR",
     "length_km": 74.0, "is_demo": True},
    {"id": "RS-009", "name": "NH-40 Shillong-Dawki", "road_class": "NH", "district": "East Khasi Hills",
     "status": "OPEN", "risk_score": 31.0, "risk_level": "LOW", "condition": "FAIR",
     "length_km": 82.4, "is_demo": True},
    {"id": "RS-010", "name": "District Road DR-156", "road_class": "DR", "district": "Morigaon",
     "status": "BLOCKED", "risk_score": 100.0, "risk_level": "CRITICAL", "condition": "VERY_POOR",
     "length_km": 14.8, "is_demo": True},
]


@router.get("/")
async def list_roads(
    status: str = None,
    risk_level: str = None,
    search: str = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_session)
):
    """List road segments — live DB or demo fallback."""
    try:
        result = await db.execute(text(
            "SELECT id, name, road_class, status, risk_score, risk_level FROM road_segments LIMIT :lim OFFSET :off",
        ), {"lim": size, "off": (page - 1) * size})
        rows = result.mappings().all()
        if rows:
            return {"data": [dict(r) for r in rows], "total": len(rows), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for roads: {e}")

    # Demo fallback
    items = DEMO_ROADS
    if status:
        items = [r for r in items if r["status"] == status]
    if risk_level:
        items = [r for r in items if r["risk_level"] == risk_level]
    if search:
        items = [r for r in items if search.lower() in r["name"].lower() or search.lower() in r["district"].lower()]
    start = (page - 1) * size
    return {
        "data": items[start:start + size],
        "total": len(items),
        "page": page,
        "source": "demo",
        "data_label": "[DEMO DATA — Synthetic Northeast India road segments]"
    }


@router.get("/segments/geojson")
async def get_road_segments_geojson(
    min_lat: float = Query(25.0),
    min_lon: float = Query(90.0),
    max_lat: float = Query(28.0),
    max_lon: float = Query(96.0),
    db: AsyncSession = Depends(get_session)
):
    """GeoJSON road segments for map rendering."""
    try:
        result = await db.execute(text(
            "SELECT id, status, risk_score, risk_level, ST_AsGeoJSON(geom) as geometry "
            "FROM road_segments "
            "WHERE ST_Intersects(geom, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)) LIMIT 500"
        ), {"min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat})
        rows = result.mappings().all()
        if rows:
            import json
            return {
                "type": "FeatureCollection",
                "features": [{"type": "Feature", "geometry": json.loads(r["geometry"]),
                               "properties": {"id": r["id"], "status": r["status"], "risk_score": r["risk_score"]}}
                             for r in rows]
            }
    except Exception as e:
        logger.debug(f"DB unavailable for geojson: {e}")

    return {"type": "FeatureCollection", "features": [], "note": "PostGIS required for live GeoJSON"}


@router.get("/summary/stats")
async def get_road_stats(db: AsyncSession = Depends(get_session)):
    """Aggregated road status counts."""
    try:
        result = await db.execute(text(
            "SELECT status, COUNT(*) as count FROM road_segments GROUP BY status"
        ))
        rows = result.mappings().all()
        if rows:
            return {"stats": [dict(r) for r in rows], "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for stats: {e}")

    # Demo counts
    from collections import Counter
    counts = Counter(r["status"] for r in DEMO_ROADS)
    return {
        "stats": [{"status": k, "count": v} for k, v in counts.items()],
        "total": len(DEMO_ROADS),
        "source": "demo"
    }


@router.get("/{road_id}")
async def get_road_detail(road_id: str, db: AsyncSession = Depends(get_session)):
    """Get single road segment detail."""
    try:
        result = await db.execute(text(
            "SELECT * FROM road_segments WHERE id = :id"
        ), {"id": road_id})
        row = result.mappings().first()
        if row:
            return {"data": dict(row), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")

    demo = next((r for r in DEMO_ROADS if r["id"] == road_id), None)
    if demo:
        return {"data": demo, "source": "demo"}
    return {"error": "Road not found", "id": road_id}
