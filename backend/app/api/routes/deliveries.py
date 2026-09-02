"""
NER-RAKSHA Deliveries API — fully async with demo fallback.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/deliveries", tags=["Deliveries"])

_DEMO_DELIVERIES = [
    {"id": "DEL-89312A", "vehicle_id": "V-1001", "cargo": "Medical Supplies",
     "priority": "CRITICAL", "status": "IN_TRANSIT", "origin": "Guwahati Hub",
     "destination": "Shillong Civil Hospital", "est_arrival": "2026-09-03T07:30:00Z",
     "delay_mins": 0, "created_at": "2026-09-03T03:15:00Z", "is_demo": True},
    {"id": "DEL-89312B", "vehicle_id": "V-1002", "cargo": "Food Rations",
     "priority": "IMPORTANT", "status": "DELAYED", "origin": "Guwahati Hub",
     "destination": "Nagaon Relief Camp", "est_arrival": "2026-09-03T08:45:00Z",
     "delay_mins": 45, "created_at": "2026-09-03T02:50:00Z", "is_demo": True},
    {"id": "DEL-89312C", "vehicle_id": "V-1003", "cargo": "Emergency Medical",
     "priority": "CRITICAL", "status": "REROUTED", "origin": "Silchar",
     "destination": "Karimganj", "est_arrival": "2026-09-03T06:15:00Z",
     "delay_mins": 15, "created_at": "2026-09-03T04:20:00Z", "is_demo": True},
    {"id": "DEL-89312D", "vehicle_id": "V-1006", "cargo": "Water Purifiers",
     "priority": "IMPORTANT", "status": "DELAYED", "origin": "Jorhat Hub",
     "destination": "Majuli", "est_arrival": "2026-09-03T09:00:00Z",
     "delay_mins": 120, "created_at": "2026-09-03T01:10:00Z", "is_demo": True},
    {"id": "DEL-89312E", "vehicle_id": "None", "cargo": "Tents",
     "priority": "NORMAL", "status": "PLANNED", "origin": "Guwahati Hub",
     "destination": "Tezpur", "est_arrival": "2026-09-03T11:00:00Z",
     "delay_mins": 0, "created_at": "2026-09-03T05:00:00Z", "is_demo": True},
]


@router.get("/")
async def list_deliveries(
    status: str = None,
    priority: str = None,
    vehicle_id: str = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_session)
):
    try:
        query = "SELECT * FROM deliveries WHERE 1=1"
        params = {"lim": size, "off": (page - 1) * size}
        
        if status:
            query += " AND status = :status"
            params["status"] = status
        if priority:
            query += " AND priority = :priority"
            params["priority"] = priority
        if vehicle_id:
            query += " AND vehicle_id = :vehicle_id"
            params["vehicle_id"] = vehicle_id
            
        query += " ORDER BY created_at DESC LIMIT :lim OFFSET :off"
        
        result = await db.execute(text(query), params)
        rows = result.mappings().all()
        if rows:
            return {"data": [dict(r) for r in rows], "total": len(rows), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for deliveries: {e}")

    items = _DEMO_DELIVERIES
    if status:
        items = [d for d in items if d["status"] == status]
    if priority:
        items = [d for d in items if d["priority"] == priority]
    if vehicle_id:
        items = [d for d in items if d["vehicle_id"] == vehicle_id]

    start = (page - 1) * size
    return {"data": items[start:start + size], "total": len(items), "source": "demo"}


@router.get("/stats/summary")
async def get_delivery_summary(db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text("SELECT status, COUNT(*) as count FROM deliveries GROUP BY status"))
        rows = result.mappings().all()
        if rows:
            return {"by_status": {r["status"]: r["count"] for r in rows}, "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable for delivery stats: {e}")

    from collections import Counter
    counts = Counter(d["status"] for d in _DEMO_DELIVERIES)
    return {"by_status": dict(counts), "source": "demo"}


@router.get("/{did}")
async def get_delivery_detail(did: str, db: AsyncSession = Depends(get_session)):
    try:
        result = await db.execute(text("SELECT * FROM deliveries WHERE id = :id"), {"id": did})
        row = result.mappings().first()
        if row:
            return {"data": dict(row), "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")

    demo = next((d for d in _DEMO_DELIVERIES if d["id"] == did), None)
    if demo:
        return {"data": demo, "source": "demo"}
    return {"error": "Delivery not found", "id": did}


@router.patch("/{did}/status")
async def update_delivery_status(did: str, status: str = Query(...), db: AsyncSession = Depends(get_session)):
    try:
        await db.execute(text("UPDATE deliveries SET status = :status WHERE id = :id"), 
                        {"status": status, "id": did})
        await db.commit()
        return {"message": "Delivery status updated", "source": "live"}
    except Exception as e:
        logger.debug(f"DB unavailable: {e}")
        
    for d in _DEMO_DELIVERIES:
        if d["id"] == did:
            d["status"] = status
    return {"message": "[DEMO] Delivery status updated", "source": "demo"}
