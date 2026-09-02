from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from app.config import settings
from datetime import datetime, timezone
import httpx
import uuid
import math
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/api/routes', tags=['Route Planning'])

class DemoRoutingEngine:
    @staticmethod
    def get_alternatives(lat1, lon1, lat2, lon2, origin_name, destination_name):
        dist = math.sqrt((lat1-lat2)**2 + (lon1-lon2)**2) * 111 # rough km
        base_dur = int(dist * 60) # roughly 1 min per km
        
        return [
            {
                'id': str(uuid.uuid4()),
                'name': f'FASTEST: {origin_name} to {destination_name} via Main Highway',
                'distance_km': round(dist, 1),
                'duration_s': base_dur * 60,
                'risk_score': 75.0,
                'expected_delay_m': 45,
                'geometry': None,
                'segments_count': int(dist * 2)
            },
            {
                'id': str(uuid.uuid4()),
                'name': f'BALANCED: {origin_name} to {destination_name} via State Route',
                'distance_km': round(dist * 1.15, 1),
                'duration_s': int(base_dur * 1.15 * 60),
                'risk_score': 45.0,
                'expected_delay_m': 15,
                'geometry': None,
                'segments_count': int(dist * 2.3)
            },
            {
                'id': str(uuid.uuid4()),
                'name': f'SAFEST: {origin_name} to {destination_name} via Bypass',
                'distance_km': round(dist * 1.3, 1),
                'duration_s': int(base_dur * 1.3 * 60),
                'risk_score': 15.0,
                'expected_delay_m': 0,
                'geometry': None,
                'segments_count': int(dist * 2.6)
            }
        ]

@router.post('/plan')
async def plan_route(body: dict, db: AsyncSession = Depends(get_session)):
    lat1 = body.get('origin_lat')
    lon1 = body.get('origin_lon')
    lat2 = body.get('destination_lat')
    lon2 = body.get('destination_lon')
    origin_name = body.get('origin_name', 'Origin')
    destination_name = body.get('destination_name', 'Destination')
    mission_type = body.get('mission_type', 'STANDARD')
    cargo_priority = body.get('cargo_priority', 'NORMAL')
    priority_mode = body.get('priority_mode', 'FASTEST')
    vehicle_id = body.get('vehicle_id')
    
    if not all([lat1, lon1, lat2, lon2]):
        raise HTTPException(400, 'Missing coordinates')

    options = DemoRoutingEngine.get_alternatives(lat1, lon1, lat2, lon2, origin_name, destination_name)
    
    # Sort
    if priority_mode == 'FASTEST':
        options.sort(key=lambda x: x['duration_s'])
    elif priority_mode == 'BALANCED':
        options.sort(key=lambda x: 0.5 * x['duration_s'] + 0.5 * x['risk_score'])
    elif priority_mode == 'SAFEST':
        options.sort(key=lambda x: 0.2 * x['duration_s'] + 0.8 * x['risk_score'])
        
    recommended = options[0]
    
    if cargo_priority == 'CRITICAL' and priority_mode != 'SAFEST':
        # Auto recommend safest
        safest = min(options, key=lambda x: x['risk_score'])
        recommended = safest
    
    for i, opt in enumerate(options):
        if opt['id'] == recommended['id']:
            opt['label'] = 'RECOMMENDED' if cargo_priority != 'CRITICAL' or priority_mode == 'SAFEST' else 'SAFEST BALANCED OPTION'
        else:
            opt['label'] = f'ALTERNATIVE {i+1}'

    why_rec = f"Selected based on {priority_mode} profile."
    if recommended['label'] == 'SAFEST BALANCED OPTION':
        fastest = min(options, key=lambda x: x['duration_s'])
        diff_m = (recommended['duration_s'] - fastest['duration_s']) // 60
        why_rec = f'This route is {diff_m} minutes slower than the fastest option but has significantly lower disruption risk. Recommended for CRITICAL cargo.'
        
    why_not = "N/A"
    fastest = min(options, key=lambda x: x['duration_s'])
    if recommended['id'] != fastest['id']:
        why_not = "Fastest route has higher disruption risk."
        
    # Save to db
    for opt in options:
        await db.execute(text("""
            INSERT INTO routes (id, name, distance_m, duration_s, status, risk_score, created_at)
            VALUES (:id, :name, :dist, :dur, 'PLANNED', :risk, :now)
        """), {
            'id': opt['id'], 'name': opt['name'], 'dist': opt['distance_km']*1000,
            'dur': opt['duration_s'], 'risk': opt['risk_score'], 'now': datetime.now(timezone.utc)
        })
        
    await db.execute(text("""
        INSERT INTO operational_events (event_type, description, created_at, source)
        VALUES ('route_calculated', 'Route options calculated', :now, 'SYSTEM')
    """), {'now': datetime.now(timezone.utc)})
    await db.commit()
    
    return {
        'options': options,
        'recommended_option_id': recommended['id'],
        'why_recommended': why_rec,
        'why_not_fastest': why_not,
        'comparison': options
    }

@router.post('/compare')
async def compare_routes(body: dict, db: AsyncSession = Depends(get_session)):
    id_a = body.get('option_a_id')
    id_b = body.get('option_b_id')
    
    res = await db.execute(text("SELECT * FROM routes WHERE id IN (:a, :b)"), {'a': id_a, 'b': id_b})
    routes = res.fetchall()
    return {'routes': [dict(r._mapping) for r in routes]}

@router.post('/reroute')
async def reroute(body: dict, db: AsyncSession = Depends(get_session)):
    v_id = body.get('vehicle_id')
    reason = body.get('reason')
    curr_id = body.get('current_route_id')
    
    if curr_id:
        await db.execute(text("UPDATE routes SET status='INVALIDATED' WHERE id=:id"), {'id': curr_id})
        
    if v_id:
        await db.execute(text("UPDATE vehicles SET status='REROUTING' WHERE id=:id"), {'id': v_id})
        
    now = datetime.now(timezone.utc)
    new_route_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO routes (id, name, distance_m, duration_s, status, risk_score, created_at)
        VALUES (:id, 'REROUTED PATH', 15000, 3600, 'PLANNED', 10.0, :now)
    """), {'id': new_route_id, 'now': now})
    
    await db.execute(text("""
        INSERT INTO alerts (title, severity, type, created_at, message)
        VALUES ('ROUTE_INTERRUPTED', 'HIGH', 'ROUTE', :now, :msg)
    """), {'now': now, 'msg': reason})
    
    await db.execute(text("""
        INSERT INTO operational_events (event_type, description, created_at, source)
        VALUES ('route_invalidated', 'Route invalidated due to: ' || :msg, :now, 'SYSTEM')
    """), {'msg': reason, 'now': now})
    
    await db.commit()
    return {'new_route_id': new_route_id, 'eta_impact_minutes': 18, 'message': 'Rerouted successfully'}

@router.get('/{route_id}')
async def get_route(route_id: str, db: AsyncSession = Depends(get_session)):
    res = await db.execute(text("SELECT * FROM routes WHERE id=:id"), {'id': route_id})
    row = res.fetchone()
    if not row:
        raise HTTPException(404, "Route not found")
    return {'route': dict(row._mapping)}

@router.post('/{route_id}/select')
async def select_route(route_id: str, body: dict, db: AsyncSession = Depends(get_session)):
    v_id = body.get('vehicle_id')
    
    if v_id:
        await db.execute(text("UPDATE vehicles SET current_route_id=:rid WHERE id=:vid"), {'rid': route_id, 'vid': v_id})
    
    await db.execute(text("UPDATE routes SET status='ACTIVE' WHERE id=:id"), {'id': route_id})
    
    await db.execute(text("""
        INSERT INTO operational_events (event_type, description, created_at, source)
        VALUES ('route_selected', 'Route selected', :now, 'SYSTEM')
    """), {'now': datetime.now(timezone.utc)})
    
    await db.commit()
    return {'status': 'success'}
