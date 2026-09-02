from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime

class IncidentCreate(BaseModel):
    type: str
    description: str
    lat: float
    lon: float

class IncidentResponse(BaseModel):
    id: int
    type: str
    status: str
    description: str
    lat: float
    lon: float
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class IncidentListItem(BaseModel):
    id: int
    type: str
    status: str
    lat: float
    lon: float
    reported_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class IncidentVerify(BaseModel):
    status: str
    notes: Optional[str] = None

class VehicleResponse(BaseModel):
    id: int
    plate_number: str
    type: str
    status: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

class DeliveryResponse(BaseModel):
    id: int
    tracking_id: str
    status: str
    origin: str
    destination: str
    
    model_config = ConfigDict(from_attributes=True)

class RouteResponse(BaseModel):
    id: int
    name: str
    distance_km: float
    estimated_time_min: float
    geometry: Dict[str, Any] # GeoJSON
    
    model_config = ConfigDict(from_attributes=True)

class FieldReportCreate(BaseModel):
    reporter_name: str
    details: str
    lat: float
    lon: float

class FieldReportResponse(BaseModel):
    id: int
    reporter_name: str
    details: str
    lat: float
    lon: float
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)
