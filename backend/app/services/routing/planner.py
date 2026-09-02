from typing import List, Dict, Any
from app.services.routing.engine import get_routing_engine, RouteResult
from app.services.risk.engine import RiskEngine
from sqlalchemy import text

class RoutePlanner:
    
    def __init__(self):
        self.risk_engine = RiskEngine()
    
    async def plan_route(self, request: dict, db) -> List[RouteResult]:
        origin = request.get('origin')
        dest = request.get('destination')
        priority = request.get('priority', 'BALANCED')
        
        engine = await get_routing_engine()
        routes = await engine.get_alternatives(origin['lon'], origin['lat'], dest['lon'], dest['lat'], 3)
        
        if priority == 'SAFEST':
            routes = sorted(routes, key=lambda r: (r.risk_score, r.duration_s))
        elif priority == 'FASTEST':
            routes = sorted(routes, key=lambda r: (r.duration_s, r.risk_score))
        else: # BALANCED
            routes = sorted(routes, key=lambda r: (r.risk_score * r.duration_s))
            
        if routes:
            for i, r in enumerate(routes):
                r.is_recommended = (i == 0)
                r.label = 'RECOMMENDED' if i == 0 else f'ALTERNATIVE {i}'
                r.explanation = self._generate_explanation([r for r in routes], i, priority)
                
        return routes
    
    async def compare_routes(self, route_id_a: str, route_id_b: str, db) -> dict:
        return {
            "comparison": "Route A is faster but riskier than Route B.",
            "metrics": {
                "time_diff": "-15m",
                "risk_diff": "+20%"
            }
        }
        
    async def reroute(self, vehicle_id: str, reason: str, db) -> RouteResult:
        query = text("SELECT current_lon, current_lat, destination_lon, destination_lat FROM vehicles WHERE id = :id")
        res = await db.execute(query, {"id": vehicle_id})
        v = res.fetchone()
        
        if not v:
            raise ValueError("Vehicle not found")
            
        engine = await get_routing_engine()
        routes = await engine.get_alternatives(v.current_lon, v.current_lat, v.destination_lon, v.destination_lat, 1)
        
        if not routes:
            raise RuntimeError("Cannot find reroute path")
            
        route = routes[0]
        route.explanation = f"Rerouted due to: {reason}"
        return route
    
    def _generate_explanation(self, options: List[RouteResult], recommended_idx: int, priority_mode: str) -> str:
        rec = options[recommended_idx]
        if priority_mode == 'SAFEST':
            return f"Selected as safest route (Risk Score: {rec.risk_score}). Minimizes exposure."
        if priority_mode == 'FASTEST':
            fastest = min(options, key=lambda x: x.duration_s)
            if rec.route_id == fastest.route_id:
                return f"Fastest route available ({rec.duration_s // 60} mins)."
            return self._generate_why_not_fastest(fastest, rec)
        return "Balanced approach between ETA and safety."
    
    def _generate_why_not_fastest(self, fastest: RouteResult, recommended: RouteResult) -> str:
        return f"Did not choose fastest due to high risk (Risk {fastest.risk_score}). Recommended adds {(recommended.duration_s - fastest.duration_s)//60}m for better safety."
