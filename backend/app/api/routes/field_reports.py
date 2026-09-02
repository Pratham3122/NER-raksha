from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import json

from app.api.dependencies import get_session as get_db

router = APIRouter(prefix='/api/field-reports', tags=['Field Reports'])

@router.get("/")
def list_field_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * size
    query = "SELECT * FROM field_reports ORDER BY reported_at DESC LIMIT :limit OFFSET :offset"
    
    result = db.execute(text(query), {"limit": size, "offset": offset}).mappings().all()
    total_count = db.execute(text("SELECT COUNT(*) FROM field_reports")).scalar()
    
    return {
        "items": [dict(r) for r in result],
        "total": total_count,
        "page": page,
        "size": size
    }

@router.post("")
def submit_field_report(
    report: dict = Body(...),
    db: Session = Depends(get_db)
):
    # Insert report
    insert_report_q = text("""
        INSERT INTO field_reports (reporter_id, description, location_lat, location_lon, media_urls, reported_at)
        VALUES (:reporter_id, :description, :lat, :lon, :media_urls, NOW())
        RETURNING id
    """)
    report_id = db.execute(insert_report_q, {
        "reporter_id": report.get("reporter_id"),
        "description": report.get("description"),
        "lat": report.get("location_lat"),
        "lon": report.get("location_lon"),
        "media_urls": json.dumps(report.get("media_urls", []))
    }).scalar()
    
    # Create incident
    insert_incident_q = text("""
        INSERT INTO incidents (title, type, severity, status, description, reported_at)
        VALUES (:title, :type, :severity, 'PENDING', :description, NOW())
        RETURNING id
    """)
    incident_id = db.execute(insert_incident_q, {
        "title": f"Field Report: {report.get('description', '')[:30]}",
        "type": report.get("incident_type", "OTHER"),
        "severity": report.get("incident_severity", "MEDIUM"),
        "description": report.get("description")
    }).scalar()
    
    # Link incident to report
    db.execute(text("UPDATE field_reports SET incident_id = :inc_id WHERE id = :rep_id"),
               {"inc_id": incident_id, "rep_id": report_id})
               
    # Event
    db.execute(text("""
        INSERT INTO operational_events (entity_type, entity_id, event_type, details, severity)
        VALUES ('FIELD_REPORT', :id, 'FIELD_REPORT_RECEIVED', '{}', 'INFO')
    """), {"id": report_id})
    
    db.commit()
    return {"message": "Field report submitted", "id": report_id, "incident_id": incident_id}

@router.get("/{id}")
def get_field_report(id: str, db: Session = Depends(get_db)):
    report = db.execute(text("SELECT * FROM field_reports WHERE id = :id"), {"id": id}).mappings().first()
    if not report:
        raise HTTPException(status_code=404, detail="Field report not found")
    return dict(report)
