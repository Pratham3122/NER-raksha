from sqlalchemy import text

class DemoScenario:
    """
    Controls the MED-101 demo scenario.
    """
    
    EVENTS = [
        {'id': 1, 'name': 'NORMAL_CONDITIONS', 'label': 'System initialized — normal conditions'},
        {'id': 2, 'name': 'WEATHER_DETERIORATES', 'label': 'Rainfall intensifying in corridor'},
        {'id': 3, 'name': 'RISK_INCREASES', 'label': 'NH-6 segment risk elevated to HIGH'},
        {'id': 4, 'name': 'ML_PREDICTS', 'label': 'ML model: 78% disruption probability'},
        {'id': 5, 'name': 'ROUTE_FLAGGED', 'label': 'Critical alert generated for MED-101 route'},
        {'id': 6, 'name': 'ROUTE_OPTIONS', 'label': 'Route planner shows 3 alternatives'},
        {'id': 7, 'name': 'ROUTE_SELECTED', 'label': 'Safest route selected — MED-101 en route'},
        {'id': 8, 'name': 'FIELD_REPORT', 'label': 'Field report: Landslide near NH-6 km 45'},
        {'id': 9, 'name': 'INCIDENT_VERIFIED', 'label': 'Control room verifies landslide'},
        {'id': 10, 'name': 'ROAD_BLOCKED', 'label': 'NH-6 km 45 — status: BLOCKED'},
        {'id': 11, 'name': 'ROUTE_INVALIDATED', 'label': 'MED-101 route no longer viable'},
        {'id': 12, 'name': 'REROUTED', 'label': 'MED-101 rerouted via NH-37 (+18 min)'},
        {'id': 13, 'name': 'DELIVERED', 'label': 'MED-101 delivered — mission complete'},
    ]
    
    def __init__(self):
        self.current_event_index = -1
        self.is_running = False
        self.is_paused = False
    
    async def start(self, db):
        """Initialize demo state in DB."""
        self.current_event_index = 0
        self.is_running = True
        self.is_paused = False
        await self._execute_event(self.EVENTS[0], db)
    
    async def advance(self, db) -> dict:
        """Execute next event, update DB, return event details."""
        if not self.is_running:
            return {"status": "not_running"}
            
        if self.current_event_index < len(self.EVENTS) - 1:
            self.current_event_index += 1
            event = self.EVENTS[self.current_event_index]
            await self._execute_event(event, db)
            return {"status": "advanced", "event": event}
        else:
            self.is_running = False
            return {"status": "completed"}
    
    async def reset(self, db):
        """Reset all demo state."""
        self.current_event_index = -1
        self.is_running = False
        self.is_paused = False
    
    async def _execute_event(self, event, db):
        """Execute specific demo event mutations on DB."""
        pass # Actual SQL mutations for the demo state go here
    
    def get_status(self) -> dict:
        if self.current_event_index == -1:
            return {"status": "inactive"}
            
        return {
            "status": "running" if self.is_running else "completed",
            "current_event": self.EVENTS[self.current_event_index],
            "progress": (self.current_event_index + 1) / len(self.EVENTS)
        }
