from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional
import httpx
import json
import math

@dataclass
class RouteResult:
    route_id: str
    geometry: dict  # GeoJSON LineString
    distance_m: float
    duration_s: float
    risk_score: float
    risk_level: str
    expected_delay_s: float
    blocked_segments: int
    high_risk_segments: int
    explanation: str
    route_status: str  # 'active', 'degraded', 'demo'
    label: str
    is_recommended: bool = False

class RoutingEngine(ABC):
    @abstractmethod
    async def get_route(self, origin_lon: float, origin_lat: float, 
                        dest_lon: float, dest_lat: float) -> Optional[RouteResult]:
        pass
    
    @abstractmethod
    async def get_alternatives(self, origin_lon: float, origin_lat: float,
                               dest_lon: float, dest_lat: float, n: int = 3) -> List[RouteResult]:
        pass

class OSRMEngine(RoutingEngine):
    """Routes via OSRM public demo API. Not for production high-volume use."""
    BASE_URL = 'http://router.project-osrm.org'
    
    async def get_route(self, origin_lon, origin_lat, dest_lon, dest_lat) -> Optional[RouteResult]:
        try:
            url = f"{self.BASE_URL}/route/v1/driving/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
            params = {'overview': 'full', 'geometries': 'geojson', 'steps': 'false'}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                data = resp.json()
            if data.get('code') == 'Ok' and data.get('routes'):
                route = data['routes'][0]
                return RouteResult(
                    route_id='osrm_primary',
                    geometry=route['geometry'],
                    distance_m=route['distance'],
                    duration_s=route['duration'],
                    risk_score=0,
                    risk_level='UNKNOWN',
                    expected_delay_s=0,
                    blocked_segments=0,
                    high_risk_segments=0,
                    explanation='Route via OSRM',
                    route_status='active',
                    label='RECOMMENDED',
                    is_recommended=True
                )
        except Exception as e:
            return None
    
    async def get_alternatives(self, origin_lon, origin_lat, dest_lon, dest_lat, n=3) -> List[RouteResult]:
        try:
            url = f"{self.BASE_URL}/route/v1/driving/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
            params = {'overview': 'full', 'geometries': 'geojson', 'alternatives': 'true', 'steps': 'false'}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                data = resp.json()
            results = []
            if data.get('code') == 'Ok':
                for i, route in enumerate(data.get('routes', [])[:n]):
                    results.append(RouteResult(
                        route_id=f'osrm_{i}',
                        geometry=route['geometry'],
                        distance_m=route['distance'],
                        duration_s=route['duration'],
                        risk_score=0,
                        risk_level='UNKNOWN',
                        expected_delay_s=0,
                        blocked_segments=0,
                        high_risk_segments=0,
                        explanation=f'Route option {i+1} via OSRM',
                        route_status='active',
                        label=['RECOMMENDED', 'ALTERNATIVE 1', 'ALTERNATIVE 2'][i] if i < 3 else f'ALTERNATIVE {i}',
                        is_recommended=(i == 0),
                    ))
            return results
        except Exception:
            return []

class DemoRoutingEngine(RoutingEngine):
    """
    Demo routing engine using pre-computed route geometries.
    Used when external routing services are unavailable.
    Clearly labeled as DEMO.
    """
    
    def _haversine(self, lat1, lon1, lat2, lon2) -> float:
        R = 6371000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
        return 2*R*math.asin(math.sqrt(a))
    
    def _interpolate_route(self, origin_lon, origin_lat, dest_lon, dest_lat, waypoints=8) -> list:
        """Generate a realistic-looking route with intermediate waypoints."""
        coords = [[origin_lon, origin_lat]]
        for i in range(1, waypoints):
            t = i / waypoints
            jitter_lat = (math.sin(t * math.pi * 2) * 0.01)
            jitter_lon = (math.cos(t * math.pi * 3) * 0.008)
            coords.append([
                origin_lon + (dest_lon - origin_lon) * t + jitter_lon,
                origin_lat + (dest_lat - origin_lat) * t + jitter_lat,
            ])
        coords.append([dest_lon, dest_lat])
        return coords
    
    async def get_route(self, origin_lon, origin_lat, dest_lon, dest_lat) -> RouteResult:
        dist = self._haversine(origin_lat, origin_lon, dest_lat, dest_lon)
        coords = self._interpolate_route(origin_lon, origin_lat, dest_lon, dest_lat, 10)
        duration = (dist / 1000) / 40 * 3600  # 40 km/h avg
        return RouteResult(
            route_id='demo_primary',
            geometry={'type': 'LineString', 'coordinates': coords},
            distance_m=dist * 1.3,
            duration_s=duration,
            risk_score=0,
            risk_level='UNKNOWN',
            expected_delay_s=0,
            blocked_segments=0,
            high_risk_segments=0,
            explanation='[DEMO ROUTE] Simulated route geometry',
            route_status='demo',
            label='RECOMMENDED',
            is_recommended=True,
        )
    
    async def get_alternatives(self, origin_lon, origin_lat, dest_lon, dest_lat, n=3) -> List[RouteResult]:
        dist = self._haversine(origin_lat, origin_lon, dest_lat, dest_lon)
        results = []
        for i in range(min(n, 3)):
            offset = (i * 0.02)
            coords = self._interpolate_route(
                origin_lon + offset, origin_lat,
                dest_lon + offset, dest_lat,
                10 + i * 2
            )
            factor = [1.0, 1.15, 1.3][i]
            results.append(RouteResult(
                route_id=f'demo_{i}',
                geometry={'type': 'LineString', 'coordinates': coords},
                distance_m=dist * 1.3 * factor,
                duration_s=(dist / 1000) / 40 * 3600 * factor,
                risk_score=[35.0, 20.0, 55.0][i],
                risk_level=['MEDIUM', 'LOW', 'HIGH'][i],
                expected_delay_s=[600.0, 900.0, 300.0][i],
                blocked_segments=[0, 0, 1][i],
                high_risk_segments=[1, 0, 2][i],
                explanation=[
                    '[DEMO] Balanced route with moderate risk',
                    '[DEMO] Safest route via longer path',
                    '[DEMO] Fastest route with higher risk exposure',
                ][i],
                route_status='demo',
                label=['RECOMMENDED', 'ALTERNATIVE 1', 'ALTERNATIVE 2'][i],
                is_recommended=(i == 0),
            ))
        return results

async def get_routing_engine(mode: str = None) -> RoutingEngine:
    """Factory: returns appropriate routing engine based on config."""
    # Hardcoded fallback for now, would typically use app.config
    if mode == 'osrm':
        try:
            return OSRMEngine()
        except Exception:
            pass
    return DemoRoutingEngine()
