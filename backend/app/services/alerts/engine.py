from sqlalchemy import text
from datetime import datetime, timezone
import uuid

class AlertEngine:
    async def create_alert(self, db, severity, type, title, message, 
                           location=None, related_road_id=None,
                           related_vehicle_id=None, related_incident_id=None,
                           related_delivery_id=None, related_route_id=None,
                           dedup_key=None) -> dict:
        """Create alert, checking for duplicates via dedup_key."""
        
        if dedup_key:
            check_q = text("SELECT id FROM alerts WHERE dedup_key = :dedup AND status = 'ACTIVE'")
            res = await db.execute(check_q, {"dedup": dedup_key})
            existing = res.fetchone()
            if existing:
                return {"id": existing.id, "status": "existing"}
                
        alert_id = str(uuid.uuid4())
        
        query = text("""
            INSERT INTO alerts (
                id, severity, type, title, message, status,
                related_road_id, related_vehicle_id, related_incident_id,
                related_delivery_id, related_route_id, dedup_key, created_at
            ) VALUES (
                :id, :sev, :typ, :title, :msg, 'ACTIVE',
                :r_road, :r_veh, :r_inc, :r_del, :r_route, :dedup, :now
            ) RETURNING id, severity, title
        """)
        
        params = {
            "id": alert_id, "sev": severity, "typ": type,
            "title": title, "msg": message, "r_road": related_road_id,
            "r_veh": related_vehicle_id, "r_inc": related_incident_id,
            "r_del": related_delivery_id, "r_route": related_route_id,
            "dedup": dedup_key, "now": datetime.now(timezone.utc)
        }
        
        await db.execute(query, params)
        await db.commit()
        return {"id": alert_id, "status": "created"}
    
    async def check_vehicle_proximity_alerts(self, vehicle_id, db):
        """Check if vehicle is approaching high-risk segments, generate alerts."""
        # Stub logic
        pass
    
    async def acknowledge_alert(self, alert_id, acknowledged_by, db):
        query = text("""
            UPDATE alerts SET status = 'ACKNOWLEDGED', 
            acknowledged_by = :by, acknowledged_at = :now
            WHERE id = :id
        """)
        await db.execute(query, {"id": alert_id, "by": acknowledged_by, "now": datetime.now(timezone.utc)})
        await db.commit()
    
    async def resolve_alert(self, alert_id, resolved_by, db):
        query = text("""
            UPDATE alerts SET status = 'RESOLVED', 
            resolved_by = :by, resolved_at = :now
            WHERE id = :id
        """)
        await db.execute(query, {"id": alert_id, "by": resolved_by, "now": datetime.now(timezone.utc)})
        await db.commit()
    
    async def get_active_alerts(self, db, limit=50) -> list:
        query = text("""
            SELECT id, severity, type, title, message, created_at
            FROM alerts WHERE status IN ('ACTIVE', 'ACKNOWLEDGED')
            ORDER BY created_at DESC LIMIT :limit
        """)
        res = await db.execute(query, {"limit": limit})
        return [dict(row._mapping) for row in res.fetchall()]
