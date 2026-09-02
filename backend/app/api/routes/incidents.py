"""
NER-RAKSHA Incidents API — fully async with demo fallback.
"""
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from datetime import datetime, timezone
import logging, uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

_DEMO_INCIDENTS = [
    {"id": "INC-092", "title": "Major Landslide on NH-6", "type": "LANDSLIDE",
     "severity": "CRITICAL", "status": "VERIFIED", "district": "Sonapur, Meghalaya",
     "lat": 25.5788, "lon": 91.8933, "reporter": "Field Unit 3",
     "created_at": "2026-09-03T05:15:00Z", "is_demo": True},
    {"id": "INC-093", "title": "Road Accident — Lane Blocked", "type": "ACCIDENT",
     "severity": "HIGH", "status": "PENDING", "district": "Nagaon Bypass",
     "lat": 26.3500, "lon": 92.6800, "reporter": "Field Unit 7",
     "created_at": "2026-09-03T05:50:00Z", "is_demo": True},
    {"id": "INC-094", "title": "Waterlogging — Passable", "type": "FLOOD",
     "severity": "MEDIUM", "status": "VERIFIED", "district": "Guwahati City",
     "lat": 26.1445, "lon": 91.7362, "reporter": "Traffic Control",
     "created_at": "2026-09-03T03:30:00Z", "is_demo": True},
    {"id": "INC-095", "title": "Bridge Routine Maintenance", "type": "BRIDGE_DAMAGE",
     "severity": "LOW", "status": "VERIFIED", "district": "Saraighat, Kamrup",
     "lat": 26.1750, "lon": 91.6400, "reporter": "PWD Team",
     "created_at": "2026-09-03T02:30:00Z", "is_demo": True},
    {"id": "INC-096", "title": "Heavy Rainfall — Flash Flood Risk", "type": "FLOOD",
     "severity": "HIGH", "status": "PENDING", "district": "Cherrapunjee Area",
     "lat": 25.2700, "lon": 91.7200, "reporter": "IMD Station",
     "created_at": "2026-09-03T04:45:00Z", "is_demo": True},
    {"id": "INC-097", "title": "Fallen Tree Blocking SH-7", "type": "ROAD_DAMAGE",
     "severity": "MEDIUM", "status": "PENDING", "district": "SH-7 km 34",
     "lat": 25.8900, "lon": 92.1100, "reporter": "Field Unit 9",
     "created_at": "2026-09-03T04:15:00Z", "is_demo": True},
]

_pending_incidents = []  # In-memory store for newly submitted demo incidents


@router.get("/")
async def list_incidents(
    severity: str = None,
    status: str = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_session)
):
    try:
        q = "SELECT id, title, type, severity, status, created_at FROM incidents ORDER BY created_at DESC LIMIT :lim OFFSET :off"
        result = await db.execute(text(q), {"lim": size, "off": (page - 1) * size})
        rows = result.mappings().all()
        if rows:
            return {"data": [dict(r) for r in rows], "total": len(rows), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for incidents: {e}")

    all_items = _pending_incidents + _DEMO_INCIDENTS
    if severity:
        all_items = [i for i in all_items if i["severity"] == severity]
    if status:
        all_items = [i for i in all_items if i["status"] == status]

    start = (page - 1) * size
    return {"data": all_items[start:start + size], "total": len(all_items),
            "source": "demo", "data_label": "[DEMO DATA]"}


@router.post("")
async def create_incident(incident: dict = Body(...), db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text(
            "INSERT INTO incidents (id, title, type, severity, status, created_at) "
            "VALUES (:id, :title, :type, :severity, 'PENDING', NOW()) RETURNING id"
        ), {"id": str(uuid.uuid4()), "title": incident.get("title"),
            "type": incident.get("type", "OTHER"), "severity": incident.get("severity", "MEDIUM")})
        await db.commit()
        return {"id": result.scalar(), "message": "Incident created", "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for create incident: {e}")

    new_id = f"INC-{200 + len(_pending_incidents)}"
    _pending_incidents.insert(0, {
        "id": new_id, "title": incident.get("title", "Unknown"), "type": incident.get("type", "OTHER"),
        "severity": incident.get("severity", "MEDIUM"), "status": "PENDING",
        "district": incident.get("location", "Unknown"), "lat": 26.1445, "lon": 91.7362,
        "reporter": incident.get("reporter", "Field Officer"),
        "created_at": datetime.now(timezone.utc).isoformat(), "is_demo": True
    })
    return {"id": new_id, "message": "Incident created (demo mode)", "source": "demo"}


@router.get("/stats/summary")
async def get_incident_summary(db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text(
            "SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity"
        ))
        rows = result.mappings().all()
        if rows:
            return {"by_severity": {r["severity"]: r["count"] for r in rows}, "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for incident stats: {e}")

    from collections import Counter
    all_items = _pending_incidents + _DEMO_INCIDENTS
    sev = Counter(i["severity"] for i in all_items)
    sta = Counter(i["status"] for i in all_items)
    return {"by_severity": dict(sev), "by_status": dict(sta), "total": len(all_items), "source": "demo"}


@router.get("/{iid}")
async def get_incident_detail(iid: str, db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text("SELECT * FROM incidents WHERE id = :id"), {"id": iid})
        row = result.mappings().first()
        if row:
            return {"data": dict(row), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")

    demo = next((i for i in (_pending_incidents + _DEMO_INCIDENTS) if i["id"] == iid), None)
    if demo:
        return {"data": demo, "source": "demo"}
    return {"error": "Incident not found", "id": iid}


@router.patch("/{iid}/verify")
async def verify_incident(iid: str, db: AsyncSession = Depends(get_session)):
    try:
        await db.execute(text("UPDATE incidents SET status='VERIFIED' WHERE id=:id"), {"id": iid})
        await db.commit()
        return {"message": "Incident verified", "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")

    for i in _pending_incidents + _DEMO_INCIDENTS:
        if i["id"] == iid:
            i["status"] = "VERIFIED"
    return {"message": "[DEMO] Incident verified", "source": "demo"}
