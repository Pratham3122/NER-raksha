from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.database import Base
from datetime import datetime
import enum

class IncidentType(str, enum.Enum):
    LANDSLIDE = "LANDSLIDE"
    FLOOD = "FLOOD"
    ROAD_DAMAGE = "ROAD_DAMAGE"
    ACCIDENT = "ACCIDENT"
    OTHER = "OTHER"

class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    VERIFIED = "VERIFIED"
    RESOLVED = "RESOLVED"
    FALSE_ALARM = "FALSE_ALARM"

class Incident(Base):
    __tablename__ = 'incidents'
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(IncidentType))
    status = Column(Enum(IncidentStatus), default=IncidentStatus.REPORTED)
    description = Column(String)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    reported_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class FieldReport(Base):
    __tablename__ = 'field_reports'
    
    id = Column(Integer, primary_key=True, index=True)
    reporter_name = Column(String)
    details = Column(String)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    timestamp = Column(DateTime, default=datetime.utcnow)

class Vehicle(Base):
    __tablename__ = 'vehicles'
    
    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True)
    type = Column(String)
    status = Column(String)

class VehiclePosition(Base):
    __tablename__ = 'vehicle_positions'
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'))
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    timestamp = Column(DateTime, default=datetime.utcnow)

class Delivery(Base):
    __tablename__ = 'deliveries'
    
    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String, unique=True, index=True)
    status = Column(String)
    origin = Column(String)
    destination = Column(String)

class Route(Base):
    __tablename__ = 'routes'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    geom = Column(Geometry(geometry_type='LINESTRING', srid=4326))
    distance_km = Column(Float)
    estimated_time_min = Column(Float)

class RouteOption(Base):
    __tablename__ = 'route_options'
    
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey('routes.id'))
    details = Column(JSON)
