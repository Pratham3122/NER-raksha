"""Analytics API routes."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from app.config import settings
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/incidents")
async def get_incident_analytics(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_session)
):
    """Incident trend data for the last N days."""
    try:
        result = await db.execute(text(f"""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical,
                COUNT(*) FILTER (WHERE severity = 'HIGH') as high,
                COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium,
                COUNT(*) FILTER (WHERE severity = 'LOW') as low,
                COUNT(*) FILTER (WHERE type = 'FLOOD') as floods,
                COUNT(*) FILTER (WHERE type = 'LANDSLIDE') as landslides,
                COUNT(*) FILTER (WHERE type = 'ROAD_DAMAGE') as road_damage,
                COUNT(*) FILTER (WHERE type = 'ACCIDENT') as accidents
            FROM incidents
            WHERE created_at >= NOW() - INTERVAL '{days} days'
            GROUP BY DATE(created_at)
            ORDER BY date
        """))
        rows = result.fetchall()
        return {
            "data": [
                {
                    "date": str(r.date),
                    "total": r.total,
                    "critical": r.critical,
                    "high": r.high,
                    "medium": r.medium,
                    "low": r.low,
                    "floods": r.floods,
                    "landslides": r.landslides,
                    "road_damage": r.road_damage,
                    "accidents": r.accidents,
                }
                for r in rows
            ],
            "days": days,
            "data_mode": settings.data_mode.upper(),
        }
    except Exception as e:
        logger.error(f"Incident analytics error: {e}")
        return {"data": [], "days": days, "data_mode": settings.data_mode.upper()}


@router.get("/roads")
async def get_road_analytics(db: AsyncSession = Depends(get_session)):
    """Road accessibility distribution."""
    try:
        result = await db.execute(text("""
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) as pct,
                ROUND(AVG(risk_score)::numeric, 1) as avg_risk
            FROM road_segments
            GROUP BY status
            ORDER BY 
                CASE status 
                    WHEN 'OPEN' THEN 1 WHEN 'AT_RISK' THEN 2 
                    WHEN 'SEVERELY_DISRUPTED' THEN 3 WHEN 'BLOCKED' THEN 4 ELSE 5 
                END
        """))
        rows = result.fetchall()
        
        total_result = await db.execute(text("SELECT COUNT(*) as total, ROUND(AVG(risk_score)::numeric,1) as avg_risk FROM road_segments"))
        total = total_result.fetchone()
        
        return {
            "distribution": [
                {
                    "status": r.status,
                    "count": r.count,
                    "percentage": float(r.pct or 0),
                    "avg_risk": float(r.avg_risk or 0),
                }
                for r in rows
            ],
            "total_segments": total.total if total else 0,
            "network_avg_risk": float(total.avg_risk or 0) if total else 0,
            "data_mode": settings.data_mode.upper(),
        }
    except Exception as e:
        logger.error(f"Road analytics error: {e}")
        return {"distribution": [], "data_mode": settings.data_mode.upper()}


@router.get("/delays")
async def get_delay_analytics(db: AsyncSession = Depends(get_session)):
    """Delivery delay statistics."""
    try:
        result = await db.execute(text("""
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(AVG(delay_minutes)::numeric, 1) as avg_delay,
                ROUND(MAX(delay_minutes)::numeric, 1) as max_delay,
                COUNT(*) FILTER (WHERE cargo_priority = 'CRITICAL') as critical_count
            FROM deliveries
            GROUP BY status
        """))
        rows = result.fetchall()
        
        summary = await db.execute(text("""
            SELECT
                ROUND(AVG(delay_minutes)::numeric, 1) as overall_avg_delay,
                COUNT(*) FILTER (WHERE status = 'DELAYED') as delayed_count,
                COUNT(*) FILTER (WHERE delay_minutes > 60) as severely_delayed,
                COUNT(*) FILTER (WHERE cargo_priority = 'CRITICAL' AND status = 'DELAYED') as critical_delayed
            FROM deliveries
        """))
        s = summary.fetchone()
        
        return {
            "by_status": [
                {
                    "status": r.status,
                    "count": r.count,
                    "avg_delay_min": float(r.avg_delay or 0),
                    "max_delay_min": float(r.max_delay or 0),
                    "critical_count": r.critical_count,
                }
                for r in rows
            ],
            "overall_avg_delay_min": float(s.overall_avg_delay or 0) if s else 0,
            "delayed_count": s.delayed_count if s else 0,
            "severely_delayed": s.severely_delayed if s else 0,
            "critical_delayed": s.critical_delayed if s else 0,
            "data_mode": settings.data_mode.upper(),
        }
    except Exception as e:
        logger.error(f"Delay analytics error: {e}")
        return {"by_status": [], "data_mode": settings.data_mode.upper()}


@router.get("/risk-distribution")
async def get_risk_distribution(db: AsyncSession = Depends(get_session)):
    """Risk score distribution across road segments."""
    try:
        result = await db.execute(text("""
            SELECT 
                risk_level,
                COUNT(*) as count,
                ROUND(MIN(risk_score)::numeric, 1) as min_score,
                ROUND(MAX(risk_score)::numeric, 1) as max_score,
                ROUND(AVG(risk_score)::numeric, 1) as avg_score
            FROM road_segments
            GROUP BY risk_level
            ORDER BY 
                CASE risk_level 
                    WHEN 'LOW' THEN 1 WHEN 'MEDIUM' THEN 2 
                    WHEN 'HIGH' THEN 3 WHEN 'CRITICAL' THEN 4 
                END
        """))
        rows = result.fetchall()
        
        # Histogram buckets
        hist = await db.execute(text("""
            SELECT 
                FLOOR(risk_score / 10) * 10 as bucket,
                COUNT(*) as count
            FROM road_segments
            WHERE risk_score IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket
        """))
        hist_rows = hist.fetchall()
        
        return {
            "by_level": [
                {
                    "risk_level": r.risk_level,
                    "count": r.count,
                    "min_score": float(r.min_score or 0),
                    "max_score": float(r.max_score or 0),
                    "avg_score": float(r.avg_score or 0),
                }
                for r in rows
            ],
            "histogram": [
                {"bucket": f"{int(r.bucket)}-{int(r.bucket)+10}", "count": r.count}
                for r in hist_rows
            ],
            "data_mode": settings.data_mode.upper(),
        }
    except Exception as e:
        logger.error(f"Risk distribution error: {e}")
        return {"by_level": [], "histogram": [], "data_mode": settings.data_mode.upper()}
