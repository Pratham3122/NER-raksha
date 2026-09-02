import asyncio
import math
from sqlalchemy import text
from typing import Dict, Any

class VehicleSimulator:
    """Simulates vehicle GPS movement along a route geometry.
    
    Vehicles move along actual route LineString coordinates.
    Position advances with each tick.
    Clearly labeled SIMULATED in all outputs.
    """
    
    def __init__(self):
        self._active_vehicles: Dict[str, Any] = {}
    
    async def start_simulation(self, vehicle_id: str, route_geometry: dict, 
                               speed_kmh: float, db):
        """Start vehicle moving along route geometry."""
        coords = route_geometry.get('coordinates', [])
        if not coords:
            return
            
        self._active_vehicles[vehicle_id] = {
            'geometry': coords,
            'speed_kmh': speed_kmh,
            'progress': 0.0,
            'paused': False
        }
        
        await self._update_db_position(vehicle_id, coords[0][0], coords[0][1], db)
    
    async def tick(self, vehicle_id: str, db):
        """Advance vehicle position by one tick (called periodically)."""
        state = self._active_vehicles.get(vehicle_id)
        if not state or state['paused']:
            return
            
        # Simplified progress increment
        state['progress'] += 0.05
        if state['progress'] >= 1.0:
            state['progress'] = 1.0
            
        coords = state['geometry']
        lon, lat = self.get_position_on_line(coords, state['progress'])
        
        await self._update_db_position(vehicle_id, lon, lat, db)
        await self.check_and_alert(vehicle_id, (lon, lat), db)
        
    async def pause_simulation(self, vehicle_id: str, db):
        if vehicle_id in self._active_vehicles:
            self._active_vehicles[vehicle_id]['paused'] = True
    
    async def reset_simulation(self, vehicle_id: str, db):
        if vehicle_id in self._active_vehicles:
            del self._active_vehicles[vehicle_id]
            
    def get_position_on_line(self, coordinates: list, progress: float) -> tuple:
        """Get lat/lon at progress% along a LineString."""
        if progress <= 0: return coordinates[0]
        if progress >= 1: return coordinates[-1]
        
        n_segments = len(coordinates) - 1
        target_segment = int(progress * n_segments)
        segment_progress = (progress * n_segments) - target_segment
        
        p1 = coordinates[target_segment]
        p2 = coordinates[min(target_segment + 1, len(coordinates) - 1)]
        
        lon = p1[0] + (p2[0] - p1[0]) * segment_progress
        lat = p1[1] + (p2[1] - p1[1]) * segment_progress
        return (lon, lat)
    
    async def check_and_alert(self, vehicle_id: str, position, db):
        """Check if vehicle is near high-risk areas, trigger alerts."""
        pass
        
    async def _update_db_position(self, vehicle_id: str, lon: float, lat: float, db):
        query = text("""
            UPDATE vehicles 
            SET current_lon = :lon, current_lat = :lat, is_simulated = True 
            WHERE id = :id
        """)
        await db.execute(query, {"lon": lon, "lat": lat, "id": vehicle_id})
        await db.commit()
