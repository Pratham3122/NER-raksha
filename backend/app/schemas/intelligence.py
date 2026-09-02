from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AlertUpdate(BaseModel):
    status: str

class RiskPredictionRequest(BaseModel):
    segment_id: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class RiskPredictionResponse(BaseModel):
    risk_score: float
    risk_level: str
    factors: Dict[str, Any]

class RoutePlanRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    mission_type: str
    priority_mode: str
    vehicle_id: Optional[int] = None

class RouteOptionResponse(BaseModel):
    id: int
    route_id: int
    details: Dict[str, Any]
    explanation: str
    
    model_config = ConfigDict(from_attributes=True)

class RoutePlanResponse(BaseModel):
    options: List[RouteOptionResponse]
    recommended_option_id: int
    comparison_table: Dict[str, Any]

class DashboardSummary(BaseModel):
    active_incidents: int
    high_risk_routes: int
    vehicles_in_transit: int
    critical_alerts: int
    overall_risk_index: float

class OperationalEventResponse(BaseModel):
    id: int
    event_type: str
    details: Dict[str, Any]
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)
