from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_session
from app.config import settings
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/api/risk', tags=['Risk Analysis'])

@router.post('/predict')
async def predict_risk(body: dict, db: AsyncSession = Depends(get_session)):
    """
    Predict disruption risk for a road segment.
    Returns risk_score, risk_level, contributing factors.
    Labeled as PROTOTYPE MODEL when ML is active.
    """
    segment_id = body.get('segment_id')
    lat = body.get('lat')
    lon = body.get('lon')
    
    # If segment_id not provided, find nearest segment
    if not segment_id and lat and lon:
        nearest = await db.execute(text(f"""
            SELECT id FROM road_segments
            ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326))
            LIMIT 1
        """))
        row = nearest.fetchone()
        if row:
            segment_id = row.id
    
    if not segment_id:
        raise HTTPException(400, 'Provide segment_id or lat/lon')
    
    # Get segment data
    seg = await db.execute(text(f"""
        SELECT rs.id, rs.status, rs.risk_score, rs.risk_level, rs.condition,
               rs.weather_risk, rs.terrain_risk, rs.incident_risk, rs.historical_risk,
               rs.speed_kmh, rs.length_m,
               r.name as road_name, r.road_class,
               d.name as district_name
        FROM road_segments rs
        LEFT JOIN roads r ON rs.road_id = r.id
        LEFT JOIN districts d ON r.district_id = d.id
        WHERE rs.id = {segment_id}
    """))
    segment = seg.fetchone()
    if not segment:
        raise HTTPException(404, f'Segment {segment_id} not found')
    
    # Get nearby incidents (5km)
    incidents = await db.execute(text(f"""
        SELECT COUNT(*) as count, 
               COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical,
               COUNT(*) FILTER (WHERE severity = 'HIGH') as high
        FROM incidents
        WHERE ST_DWithin(
            location::geography,
            (SELECT geom::geography FROM road_segments WHERE id = {segment_id}),
            5000
        ) AND status != 'REJECTED'
    """))
    inc = incidents.fetchone()
    
    # Get weather
    weather = await db.execute(text(f"""
        SELECT rainfall_mm, temperature_c, source, is_demo
        FROM weather_observations
        WHERE district_id = (
            SELECT district_id FROM roads WHERE id = (
                SELECT road_id FROM road_segments WHERE id = {segment_id}
            )
        )
        ORDER BY observed_at DESC LIMIT 1
    """))
    wx = weather.fetchone()
    
    # Get terrain
    terrain = await db.execute(text(f"""
        SELECT slope_pct, elevation_m, terrain_class
        FROM terrain
        WHERE district_id = (
            SELECT district_id FROM roads WHERE id = (
                SELECT road_id FROM road_segments WHERE id = {segment_id}
            )
        )
        LIMIT 1
    """))
    ter = terrain.fetchone()
    
    # Calculate factor scores
    status_scores = {'OPEN': 0, 'AT_RISK': 40, 'SEVERELY_DISRUPTED': 70, 'BLOCKED': 100, 'UNKNOWN': 30}
    road_status_risk = status_scores.get(segment.status, 30)
    
    incident_count = inc.count if inc else 0
    incident_risk = min(100, (incident_count * 15) + ((inc.critical or 0) * 25) + ((inc.high or 0) * 15))
    
    rainfall = wx.rainfall_mm if wx else 0
    if rainfall < 20: weather_risk = 10
    elif rainfall < 50: weather_risk = 35
    elif rainfall < 100: weather_risk = 65
    else: weather_risk = 90
    
    slope = ter.slope_pct if ter else 0
    if slope < 15: terrain_risk = 10
    elif slope < 30: terrain_risk = 40
    else: terrain_risk = 70
    
    historical_risk = float(segment.historical_risk or 20)
    
    # Weighted aggregate
    weights = {'road_status': 0.30, 'incident': 0.25, 'weather': 0.20, 'terrain': 0.15, 'historical': 0.10}
    total_risk = (
        road_status_risk * weights['road_status'] +
        incident_risk * weights['incident'] +
        weather_risk * weights['weather'] +
        terrain_risk * weights['terrain'] +
        historical_risk * weights['historical']
    )
    
    def risk_level(score):
        if score < 25: return 'LOW'
        if score < 50: return 'MEDIUM'
        if score < 75: return 'HIGH'
        return 'CRITICAL'
    
    # Try ML prediction
    ml_prediction = None
    ml_note = None
    if settings.ml_mode == 'active':
        try:
            import joblib
            import numpy as np
            model = joblib.load(settings.ml_model_path)
            features = np.array([[
                rainfall, slope, incident_count,
                road_status_risk / 100, 1 if segment.condition in ('POOR','VERY_POOR') else 0,
                historical_risk / 100,
            ]])
            prob = float(model.predict_proba(features)[0][1])
            ml_prediction = prob
            ml_note = 'PROTOTYPE MODEL | SYNTHETIC + PUBLIC DATA'
        except Exception:
            pass
    
    return {
        'segment_id': segment_id,
        'road_name': segment.road_name,
        'district': segment.district_name,
        'risk_score': round(total_risk, 1),
        'risk_level': risk_level(total_risk),
        'data_mode': settings.data_mode.upper(),
        'factors': {
            'road_status': {
                'value': segment.status,
                'score': road_status_risk,
                'weight': weights['road_status'],
                'label': 'Road Status',
            },
            'incident_proximity': {
                'value': f'{incident_count} incidents within 5km',
                'score': round(incident_risk, 1),
                'weight': weights['incident'],
                'label': 'Incident Proximity',
            },
            'weather': {
                'value': f'{rainfall:.1f} mm rainfall' if wx else 'No data',
                'score': round(weather_risk, 1),
                'weight': weights['weather'],
                'label': 'Weather / Rainfall',
                'is_demo': wx.is_demo if wx else True,
            },
            'terrain': {
                'value': f'{slope:.1f}% slope' if ter else 'No data',
                'score': round(terrain_risk, 1),
                'weight': weights['terrain'],
                'label': 'Terrain / Slope',
            },
            'historical': {
                'value': 'Historical disruption rate',
                'score': round(historical_risk, 1),
                'weight': weights['historical'],
                'label': 'Historical Incidents',
            },
        },
        'ml_prediction': ml_prediction,
        'ml_note': ml_note,
        'condition': segment.condition,
        'current_speed_kmh': segment.speed_kmh,
    }
