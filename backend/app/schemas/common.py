from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Generic, TypeVar, List, Dict, Any, Optional

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class HealthResponse(BaseModel):
    status: str
    version: str
    data_mode: str
    timestamp: str
    components: Dict[str, Any]

class StatusResponse(BaseModel):
    success: bool
    message: str

class CoordinatePoint(BaseModel):
    lat: float
    lon: float

    @field_validator('lat')
    def validate_lat(cls, v):
        if not (-90 <= v <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v
        
    @field_validator('lon')
    def validate_lon(cls, v):
        if not (-180 <= v <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v

class GeoJSONPoint(BaseModel):
    type: str = 'Point'
    coordinates: List[float] # [lon, lat]

    @field_validator('coordinates')
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError('Coordinates must be exactly [longitude, latitude]')
        if not (-180 <= v[0] <= 180) or not (-90 <= v[1] <= 90):
            raise ValueError('Invalid coordinates values')
        return v
