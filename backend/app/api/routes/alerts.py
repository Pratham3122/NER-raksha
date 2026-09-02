"""
NER-RAKSHA Alerts API — fully async with demo fallback.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

_DEMO_ALERTS = [
    {"id": "ALT-001", "severity": "CRITICAL", "type": "ROAD_BLOCKED",
     "title": "NH-37 Blocked — Kaziranga", "status": "ACTIVE",
     "description": "Active landslide blocking both lanes near Kaziranga NP. Heavy vehicles cannot pass.",
     "location": "NH-37, km 245", "created_at": "2026-09-03T05:15:00Z"},
    {"id": "ALT-002", "severity": "HIGH", "type": "RISK_INCREASED",
     "title": "Brahmaputra Bridge Risk Elevated", "status": "ACTIVE",
     "description": "Risk score increased to HIGH due to continuous rainfall. Structural monitoring active.",
     "location": "Brahmaputra Bridge, Guwahati", "created_at": "2026-09-03T05:02:00Z"},
    {"id": "ALT-003", "severity": "CRITICAL", "type": "VEHICLE_APPROACHING_RISK",
     "title": "Convoy Alpha Near Hazard Zone", "status": "ACTIVE",
     "description": "Vehicle V-1001 is 3.2km from active landslide. Auto-diversion suggested via NH-27.",
     "location": "V-1001 / NH-6", "created_at": "2026-09-03T04:58:00Z"},
    {"id": "ALT-004", "severity": "HIGH", "type": "SEVERE_WEATHER",
     "title": "Extreme Rainfall Warning — Meghalaya", "status": "ACTIVE",
     "description": "IMD issues red alert for Cherrapunjee region. Expected rainfall: 180mm in 6 hours.",
     "location": "Meghalaya East District", "created_at": "2026-09-03T04:45:00Z"},
    {"id": "ALT-005", "severity": "MEDIUM", "type": "DELIVERY_DELAY",
     "title": "Medical Supply Delivery Delayed +45min", "status": "ACTIVE",
     "description": "DEL-89312A delayed due to traffic congestion at Silchar entry checkpoint.",
     "location": "Silchar NH-54", "created_at": "2026-09-03T04:25:00Z"},
    {"id": "ALT-006", "severity": "MEDIUM", "type": "ROAD_BLOCKED",
     "title": "State Highway 5 Partial Blockage", "status": "ACTIVE",
     "description": "One lane blocked due to road repair works. Expect 20-30 min delay.",
     "location": "SH-5, Shillong", "created_at": "2026-09-03T04:10:00Z"},
    {"id": "ALT-007", "severity": "INFO", "type": "SYSTEM",
     "title": "ML Model Updated", "status": "ACTIVE",
     "description": "Disruption prediction model retrained with latest 30-day data. Accuracy: 76.2%",
     "location": "System", "created_at": "2026-09-03T03:30:00Z"},
    {"id": "ALT-008", "severity": "HIGH", "type": "ROUTE_INTERRUPTED",
     "title": "Route MED-101 Interrupted", "status": "ACKNOWLEDGED",
     "description": "Active route for medical delivery interrupted by new landslide report. Recalculating...",
     "location": "NH-6, Barak Valley", "created_at": "2026-09-03T03:15:00Z"},
    {"id": "ALT-009", "severity": "CRITICAL", "type": "NEW_INCIDENT",
     "title": "New Bridge Damage Reported", "status": "ACTIVE",
     "description": "Field report confirmed: partial collapse of minor bridge on district road near Morigaon.",
     "location": "Morigaon District", "created_at": "2026-09-03T03:00:00Z"},
    {"id": "ALT-010", "severity": "MEDIUM", "type": "RISK_INCREASED",
     "title": "Flood Risk Rising — Dhubri District", "status": "ACTIVE",
     "description": "River Brahmaputra water level at 92% of warning threshold near Dhubri.",
     "location": "Dhubri District", "created_at": "2026-09-03T02:30:00Z"},
]

_acked_ids: set = set()  # Track acknowledged demo alerts in memory


@router.get("/")
async def list_alerts(
    status: str = None,
    severity: str = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_session)
):
    try:
        result = await db.execute(text(
            "SELECT id, title, type, severity, status, description, created_at "
            "FROM alerts ORDER BY created_at DESC LIMIT :lim OFFSET :off"
        ), {"lim": size, "off": (page - 1) * size})
        rows = result.mappings().all()
        if rows:
            return {"data": [dict(r) for r in rows], "total": len(rows), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for alerts: {e}")

    items = [
        {**a, "status": "ACKNOWLEDGED" if a["id"] in _acked_ids else a["status"]}
        for a in _DEMO_ALERTS
    ]
    if status:
        items = [a for a in items if a["status"] == status]
    if severity:
        items = [a for a in items if a["severity"] == severity]

    start = (page - 1) * size
    active_count = sum(1 for a in items if a["status"] == "ACTIVE")
    return {"data": items[start:start + size], "total": len(items),
            "active_count": active_count, "source": "demo", "data_label": "[DEMO DATA]"}


@router.get("/active/count")
async def count_active_alerts(db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text("SELECT COUNT(*) FROM alerts WHERE status='ACTIVE'"))
        count = result.scalar()
        return {"active_count": count, "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")
    count = sum(1 for a in _DEMO_ALERTS if a["id"] not in _acked_ids and a["status"] == "ACTIVE")
    return {"active_count": count, "source": "demo"}


@router.patch("/{aid}")
async def update_alert(aid: str, action: str = Query(...), db: AsyncSession = Depends(get_session)):
    if action not in ["acknowledge", "resolve"]:
        return {"error": "Invalid action. Use 'acknowledge' or 'resolve'"}
    new_status = "ACKNOWLEDGED" if action == "acknowledge" else "RESOLVED"
    try:
        await db.execute(text(f"UPDATE alerts SET status=:s WHERE id=:id"), {"s": new_status, "id": aid})
        await db.commit()
        return {"message": f"Alert {action}d", "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")
    _acked_ids.add(aid)
    return {"message": f"[DEMO] Alert {action}d", "source": "demo"}


@router.get("/{aid}")
async def get_alert_detail(aid: str, db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text("SELECT * FROM alerts WHERE id=:id"), {"id": aid})
        row = result.mappings().first()
        if row:
            return {"data": dict(row), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")
    demo = next((a for a in _DEMO_ALERTS if a["id"] == aid), None)
    if demo:
        return {"data": {**demo, "status": "ACKNOWLEDGED" if aid in _acked_ids else demo["status"]}, "source": "demo"}
    return {"error": "Alert not found", "id": aid}
