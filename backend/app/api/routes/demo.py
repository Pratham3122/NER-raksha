from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from app.config import settings
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/api/demo', tags=['Demo Mode'])

_demo_state = {
    'is_active': False,
    'current_event': 0,
    'is_paused': False,
    'started_at': None,
    'vehicle_id': 'MED-101',
    'events_executed': [],
}

DEMO_EVENTS = [
    {'id': 1, 'name': 'NORMAL_CONDITIONS', 'label': 'System Initialized — Normal Conditions', 'description': 'All roads clear. MED-101 assigned critical medical delivery to Shillong Civil Hospital.'},
    {'id': 2, 'name': 'WEATHER_DETERIORATES', 'label': 'Rainfall Intensifying in NH-6 Corridor', 'description': 'IMD reports 68mm rainfall in Meghalaya corridor. Weather risk elevated.'},
    {'id': 3, 'name': 'RISK_INCREASES', 'label': 'NH-6 Segment Risk Elevated to HIGH', 'description': 'Risk engine recalculates: rainfall + slope factors push NH-6 km 40-50 to HIGH risk.'},
    {'id': 4, 'name': 'ML_PREDICTS', 'label': 'ML Model: 78% Disruption Probability on NH-6', 'description': '[PROTOTYPE MODEL] Based on historical patterns + current weather, model predicts high disruption likelihood.'},
    {'id': 5, 'name': 'ROUTE_FLAGGED', 'label': 'Critical Alert: MED-101 Route Under Risk', 'description': 'Alert generated. Current planned route includes 2 high-risk segments. Operator review required.'},
    {'id': 6, 'name': 'ROUTE_PLAN', 'label': 'Route Planner: 3 Options Computed', 'description': 'FASTEST: 42 min, RISK: HIGH. BALANCED: 51 min, RISK: MEDIUM. SAFEST: 58 min, RISK: LOW.'},
    {'id': 7, 'name': 'ROUTE_SELECTED', 'label': 'Safest Route Selected — MED-101 En Route', 'description': 'Operator selects SAFEST route. MED-101 departs Guwahati Medical College. ETA: 58 min.'},
    {'id': 8, 'name': 'FIELD_REPORT', 'label': 'Field Report: Landslide Near NH-6 km 45', 'description': 'Officer Sharma submits field report via mobile. Location: NH-6 km 45. Severity: CRITICAL.'},
    {'id': 9, 'name': 'INCIDENT_VERIFIED', 'label': 'Landslide Verified by Control Room', 'description': 'Control room operator verifies landslide. Road segment status updated to BLOCKED.'},
    {'id': 10, 'name': 'ROAD_BLOCKED', 'label': 'NH-6 km 45 — Status: BLOCKED', 'description': 'Road segment blocked. 3 routes affected. System triggering reroute evaluation.'},
    {'id': 11, 'name': 'ROUTE_INVALIDATED', 'label': 'MED-101 Route No Longer Viable', 'description': 'Active route passes through BLOCKED segment. Route invalidated. Alert: ROUTE INTERRUPTED.'},
    {'id': 12, 'name': 'REROUTED', 'label': 'MED-101 Rerouted via NH-37 (+18 min)', 'description': 'Alternative route via NH-37 selected. New ETA: +18 min. Delivery still achievable.'},
    {'id': 13, 'name': 'DELIVERED', 'label': 'MED-101 — Delivery Complete', 'description': 'MED-101 arrives Shillong Civil Hospital. Critical medical supplies delivered. Mission complete.'},
]

@router.get('/status')
async def get_demo_status():
    return {
        'state': _demo_state,
        'events': DEMO_EVENTS
    }

@router.post('/start')
async def start_demo(db: AsyncSession = Depends(get_session)):
    _demo_state['is_active'] = True
    _demo_state['current_event'] = 0
    _demo_state['started_at'] = datetime.now(timezone.utc).isoformat()
    _demo_state['events_executed'] = []
    
    await execute_event(1, db)
    return {'status': 'started'}

@router.post('/next')
async def next_demo_event(db: AsyncSession = Depends(get_session)):
    if not _demo_state['is_active']:
        raise HTTPException(400, "Demo not started")
    nxt = _demo_state['current_event'] + 1
    if nxt > len(DEMO_EVENTS):
        raise HTTPException(400, "Demo finished")
        
    await execute_event(nxt, db)
    return {'status': 'event executed', 'event_id': nxt}

@router.post('/pause')
async def pause_demo():
    _demo_state['is_paused'] = not _demo_state['is_paused']
    return {'status': 'paused' if _demo_state['is_paused'] else 'resumed'}

@router.post('/reset')
async def reset_demo(db: AsyncSession = Depends(get_session)):
    _demo_state['is_active'] = False
    _demo_state['current_event'] = 0
    _demo_state['is_paused'] = False
    _demo_state['started_at'] = None
    _demo_state['events_executed'] = []
    
    # Cleanup demo data if necessary
    await db.execute(text("DELETE FROM alerts WHERE message LIKE '[DEMO]%'"))
    await db.execute(text("DELETE FROM operational_events WHERE source='DEMO'"))
    await db.commit()
    
    return {'status': 'reset'}

async def execute_event(event_id: int, db: AsyncSession):
    now = datetime.now(timezone.utc)
    ev = next(e for e in DEMO_EVENTS if e['id'] == event_id)
    vid = _demo_state['vehicle_id']
    
    if event_id == 1:
        await db.execute(text("""
            INSERT INTO vehicles (id, name, type, status, created_at)
            VALUES (:id, 'Demo Vehicle', 'AMBULANCE', 'STOPPED', :now)
            ON CONFLICT (id) DO UPDATE SET status='STOPPED'
        """), {'id': vid, 'now': now})
        await db.execute(text("""
            INSERT INTO deliveries (id, vehicle_id, status, priority, destination_name, created_at)
            VALUES ('DEL-DEMO', :id, 'PLANNED', 'CRITICAL', 'Shillong Civil Hospital', :now)
            ON CONFLICT (id) DO UPDATE SET status='PLANNED'
        """), {'id': vid, 'now': now})
    elif event_id == 2:
        await db.execute(text("""
            INSERT INTO weather_observations (district_id, rainfall_mm, is_demo, observed_at)
            VALUES (1, 68, true, :now)
        """), {'now': now})
    elif event_id == 3:
        await db.execute(text("UPDATE road_segments SET risk_score=85, risk_level='HIGH' WHERE id=1"))
    elif event_id == 4:
        pass # Optional prediction log table
    elif event_id == 5:
        await db.execute(text("""
            INSERT INTO alerts (title, severity, type, message, created_at)
            VALUES ('RISK_INCREASED', 'CRITICAL', 'RISK', '[DEMO] Risk on route increased', :now)
        """), {'now': now})
    elif event_id == 7:
        await db.execute(text("UPDATE vehicles SET status='MOVING' WHERE id=:id"), {'id': vid})
        await db.execute(text("""
            INSERT INTO routes (id, name, status, created_at) VALUES ('R-DEMO', 'SAFEST Demo Route', 'ACTIVE', :now)
            ON CONFLICT DO NOTHING
        """), {'now': now})
    elif event_id == 8:
        await db.execute(text("""
            INSERT INTO incidents (id, severity, type, status, is_demo, created_at)
            VALUES ('INC-DEMO', 'CRITICAL', 'LANDSLIDE', 'REPORTED', true, :now)
            ON CONFLICT DO NOTHING
        """), {'now': now})
    elif event_id == 9:
        await db.execute(text("UPDATE incidents SET status='VERIFIED' WHERE id='INC-DEMO'"))
        await db.execute(text("UPDATE road_segments SET status='SEVERELY_DISRUPTED' WHERE id=1"))
    elif event_id == 10:
        await db.execute(text("UPDATE road_segments SET status='BLOCKED' WHERE id=1"))
        await db.execute(text("""
            INSERT INTO alerts (title, severity, type, message, created_at)
            VALUES ('ROAD_BLOCKED', 'CRITICAL', 'ROAD', '[DEMO] Road segment blocked', :now)
        """), {'now': now})
    elif event_id == 11:
        await db.execute(text("UPDATE routes SET status='INVALIDATED' WHERE id='R-DEMO'"))
        await db.execute(text("""
            INSERT INTO alerts (title, severity, type, message, created_at)
            VALUES ('ROUTE_INTERRUPTED', 'HIGH', 'ROUTE', '[DEMO] Route invalidated', :now)
        """), {'now': now})
    elif event_id == 12:
        await db.execute(text("UPDATE vehicles SET status='REROUTING' WHERE id=:id"), {'id': vid})
        await db.execute(text("""
            INSERT INTO routes (id, name, status, created_at) VALUES ('R-DEMO-2', 'Rerouted Path', 'ACTIVE', :now)
            ON CONFLICT DO NOTHING
        """), {'now': now})
    elif event_id == 13:
        await db.execute(text("UPDATE vehicles SET status='ARRIVED' WHERE id=:id"), {'id': vid})
        await db.execute(text("UPDATE deliveries SET status='DELIVERED' WHERE id='DEL-DEMO'"))
        
    await db.execute(text("""
        INSERT INTO operational_events (event_type, description, source, created_at)
        VALUES ('DEMO_EVENT', :desc, 'DEMO', :now)
    """), {'desc': ev['name'], 'now': now})
    await db.commit()
    
    _demo_state['current_event'] = event_id
    _demo_state['events_executed'].append(event_id)
