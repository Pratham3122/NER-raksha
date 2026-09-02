from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.api.dependencies import get_session as get_db

router = APIRouter(prefix='/api/events', tags=['Events'])

@router.get("/")
def list_events(
    entity_type: Optional[str] = None,
    severity: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * size
    query = "SELECT * FROM operational_events WHERE 1=1"
    params = {"limit": size, "offset": offset}
    
    if entity_type:
        query += " AND entity_type = :entity_type"
        params["entity_type"] = entity_type
    if severity:
        query += " AND severity = :severity"
        params["severity"] = severity
    if date_from:
        query += " AND created_at >= :date_from"
        params["date_from"] = date_from
    if date_to:
        query += " AND created_at <= :date_to"
        params["date_to"] = date_to
        
    query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
    
    result = db.execute(text(query), params).mappings().all()
    total = db.execute(text("SELECT COUNT(*) FROM operational_events")).scalar()
    
    return {
        "items": [dict(r) for r in result],
        "total": total,
        "page": page,
        "size": size
    }
