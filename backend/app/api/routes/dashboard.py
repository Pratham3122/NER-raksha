"""
NER-RAKSHA Dashboard API
Returns KPI summary for the Command Center — fully async with demo fallback.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from app.config import settings
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_session)):
    try:
        roads = (await db.execute(text("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'OPEN') as open_count, COUNT(*) FILTER (WHERE status = 'AT_RISK') as at_risk_count, COUNT(*) FILTER (WHERE status = 'SEVERELY_DISRUPTED') as disrupted_count, COUNT(*) FILTER (WHERE status = 'BLOCKED') as blocked_count FROM road_segments"))).fetchone()
        incidents = (await db.execute(text("SELECT COUNT(*) FILTER (WHERE status = 'PENDING') as pending, COUNT(*) FILTER (WHERE status = 'VERIFIED' AND created_at > NOW() - INTERVAL '24 hours') as active_24h, COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND status != 'RESOLVED') as critical FROM incidents"))).fetchone()
        alerts = (await db.execute(text("SELECT COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_alerts, COUNT(*) FILTER (WHERE status = 'ACTIVE' AND severity IN ('HIGH','CRITICAL')) as critical_alerts FROM alerts"))).fetchone()
        vehicles = (await db.execute(text("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'MOVING') as in_transit, COUNT(*) FILTER (WHERE status IN ('DELAYED','AT_RISK','REROUTING')) as at_risk FROM vehicles"))).fetchone()
        deliveries = (await db.execute(text("SELECT COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') as in_transit, COUNT(*) FILTER (WHERE status = 'DELAYED') as delayed, COUNT(*) FILTER (WHERE status = 'REROUTED') as rerouted, COUNT(*) FILTER (WHERE cargo_priority = 'CRITICAL' AND status NOT IN ('DELIVERED','CANCELLED')) as critical_active FROM deliveries"))).fetchone()
        events = (await db.execute(text("SELECT id, event_type, entity_type, description, severity, created_at FROM operational_events ORDER BY created_at DESC LIMIT 10"))).fetchall()
        avg_risk_row = (await db.execute(text("SELECT ROUND(AVG(risk_score)::numeric, 1) as avg_risk FROM road_segments"))).fetchone()

        return {
            "data_mode": settings.data_mode.upper(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "roads": {"total": roads.total, "open": roads.open_count, "at_risk": roads.at_risk_count, "disrupted": roads.disrupted_count, "blocked": roads.blocked_count, "avg_risk_score": float(avg_risk_row.avg_risk) if avg_risk_row and avg_risk_row.avg_risk else 0.0},
            "incidents": {"pending_verification": incidents.pending, "active_24h": incidents.active_24h, "critical_active": incidents.critical},
            "alerts": {"active": alerts.active_alerts, "critical": alerts.critical_alerts},
            "vehicles": {"total": vehicles.total, "in_transit": vehicles.in_transit, "at_risk": vehicles.at_risk},
            "deliveries": {"in_transit": deliveries.in_transit, "delayed": deliveries.delayed, "rerouted": deliveries.rerouted, "critical_active": deliveries.critical_active},
            "recent_events": [{"id": str(e.id), "event_type": e.event_type, "entity_type": e.entity_type, "description": e.description, "severity": e.severity, "created_at": e.created_at.isoformat() if e.created_at else None} for e in events]
        }
    except Exception as e:
        logger.debug(f"DB unavailable for dashboard, using DEMO fallback: {e}")

    # Fallback demo data
    return {
        "data_mode": "DEMO",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "roads": {"total": 1575, "open": 1432, "at_risk": 84, "disrupted": 47, "blocked": 12, "avg_risk_score": 47.3},
        "incidents": {"pending_verification": 12, "active_24h": 45, "critical_active": 8},
        "alerts": {"active": 24, "critical": 5},
        "vehicles": {"total": 86, "in_transit": 62, "at_risk": 12},
        "deliveries": {"in_transit": 41, "delayed": 8, "rerouted": 4, "critical_active": 15},
        "recent_events": [
            {"id": "EV-1", "event_type": "DIVERSION", "entity_type": "ROUTE", "description": "Auto-diverted around landslide", "severity": "WARNING", "created_at": datetime.now(timezone.utc).isoformat()}
        ],
        "notice": "[DEMO DATA] PostGIS offline"
    }
