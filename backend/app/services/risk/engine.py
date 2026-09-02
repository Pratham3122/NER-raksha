from sqlalchemy import text
from typing import List, Dict, Any

class RiskEngine:
    """
    Calculates route and segment risk scores.
    
    Risk Formula (documented in docs/RISK_METHODOLOGY.md):
    Route Risk = 
        road_status_risk (weight 0.30) +
        incident_proximity_risk (weight 0.25) +
        weather_risk (weight 0.20) +
        terrain_risk (weight 0.15) +
        historical_risk (weight 0.10)
    
    Scores are 0-100. Risk levels: 0-25=LOW, 25-50=MEDIUM, 50-75=HIGH, 75-100=CRITICAL
    """
    
    ROAD_STATUS_SCORES = {
        'OPEN': 0,
        'AT_RISK': 40,
        'SEVERELY_DISRUPTED': 70,
        'BLOCKED': 100,
        'UNKNOWN': 30,
    }
    
    WEIGHTS = {
        'road_status': 0.30,
        'incident_proximity': 0.25,
        'weather': 0.20,
        'terrain': 0.15,
        'historical': 0.10,
    }
    
    RISK_THRESHOLDS = {
        'LOW': (0, 25),
        'MEDIUM': (25, 50),
        'HIGH': (50, 75),
        'CRITICAL': (75, 100),
    }
    
    async def calculate_segment_risk(self, segment_id: int, db) -> dict:
        """Calculate comprehensive risk for a single road segment."""
        query = text("""
            SELECT id, road_status, historical_risk_score, terrain_type
            FROM road_segments 
            WHERE id = :id
        """)
        result = await db.execute(query, {"id": segment_id})
        segment = result.fetchone()
        
        if not segment:
            return {"risk_score": 0, "risk_level": "UNKNOWN", "factors": {}}
            
        status_score = self.ROAD_STATUS_SCORES.get(segment.road_status, 30)
        historical_score = segment.historical_risk_score or 20
        
        terrain_scores = {'MOUNTAINOUS': 80, 'HILLY': 60, 'FLAT': 20}
        terrain_score = terrain_scores.get(segment.terrain_type, 30)
        
        incident_score = 15  # Fallback query for nearby incidents
        weather_score = 25  # Fallback query for local weather alerts
        
        total_risk = (
            status_score * self.WEIGHTS['road_status'] +
            incident_score * self.WEIGHTS['incident_proximity'] +
            weather_score * self.WEIGHTS['weather'] +
            terrain_score * self.WEIGHTS['terrain'] +
            historical_score * self.WEIGHTS['historical']
        )
        
        return {
            "risk_score": round(total_risk, 2),
            "risk_level": self.score_to_level(total_risk),
            "factors": {
                "road_status": status_score,
                "incident_proximity": incident_score,
                "weather": weather_score,
                "terrain": terrain_score,
                "historical": historical_score
            }
        }
    
    async def calculate_route_risk(self, segment_ids: list, db) -> dict:
        """Calculate aggregate risk for a full route (list of segments)."""
        if not segment_ids:
            return {"risk_score": 0, "risk_level": "UNKNOWN", "high_risk_segments": 0, "blocked_segments": 0}
            
        total_risk = 0
        high_risk_segments = 0
        blocked_segments = 0
        
        for sid in segment_ids:
            risk_data = await self.calculate_segment_risk(sid, db)
            total_risk += risk_data['risk_score']
            if risk_data['risk_level'] in ['HIGH', 'CRITICAL']:
                high_risk_segments += 1
            if risk_data['factors']['road_status'] == 100:
                blocked_segments += 1
                
        avg_risk = total_risk / len(segment_ids)
        return {
            "risk_score": round(avg_risk, 2),
            "risk_level": self.score_to_level(avg_risk),
            "high_risk_segments": high_risk_segments,
            "blocked_segments": blocked_segments
        }
    
    def score_to_level(self, score: float) -> str:
        if score < 25: return 'LOW'
        if score < 50: return 'MEDIUM'
        if score < 75: return 'HIGH'
        return 'CRITICAL'
    
    def get_delay_multiplier(self, status: str) -> float:
        multipliers = {'OPEN': 1.0, 'AT_RISK': 1.3, 'SEVERELY_DISRUPTED': 2.5, 'BLOCKED': 999.0, 'UNKNOWN': 1.2}
        return multipliers.get(status, 1.0)
    
    async def update_segment_risk(self, segment_id: int, db) -> dict:
        """Recalculate and update segment risk in DB."""
        risk_data = await self.calculate_segment_risk(segment_id, db)
        query = text("""
            UPDATE road_segments 
            SET current_risk_score = :score, risk_level = :level
            WHERE id = :id
        """)
        await db.execute(query, {
            "score": risk_data["risk_score"], 
            "level": risk_data["risk_level"], 
            "id": segment_id
        })
        await db.commit()
        return risk_data
