from pydantic import BaseModel, ConfigDict
from typing import Optional

class StateResponse(BaseModel):
    id: int
    name: str
    code: str
    risk_level: str
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class DistrictResponse(BaseModel):
    id: int
    state_id: int
    name: str
    risk_level: str
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class RoadResponse(BaseModel):
    id: int
    name: str
    type: str
    status: str
    risk_level: str
    
    model_config = ConfigDict(from_attributes=True)

class RoadSegmentResponse(BaseModel):
    id: int
    road_id: int
    start_point: str
    end_point: str
    length_km: float
    risk_level: str
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class RouteFilter(BaseModel):
    state_id: Optional[int] = None
    district_id: Optional[int] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    road_class: Optional[str] = None
