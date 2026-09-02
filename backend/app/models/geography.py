from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.database import Base
from datetime import datetime

class State(Base):
    __tablename__ = 'states'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)
    geom = Column(Geometry(geometry_type='MULTIPOLYGON', srid=4326))
    
    districts = relationship('District', back_populates='state')

class District(Base):
    __tablename__ = 'districts'
    
    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey('states.id'))
    name = Column(String, index=True)
    geom = Column(Geometry(geometry_type='MULTIPOLYGON', srid=4326))
    
    state = relationship('State', back_populates='districts')

class Road(Base):
    __tablename__ = 'roads'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)
    status = Column(String)
    
    segments = relationship('RoadSegment', back_populates='road')

class RoadSegment(Base):
    __tablename__ = 'road_segments'
    
    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey('roads.id'))
    start_point = Column(String)
    end_point = Column(String)
    length_km = Column(Float)
    geom = Column(Geometry(geometry_type='LINESTRING', srid=4326))
    risk_level = Column(String)
    
    road = relationship('Road', back_populates='segments')

class RoadCondition(Base):
    __tablename__ = 'road_conditions'
    
    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey('road_segments.id'))
    condition = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class WeatherObservation(Base):
    __tablename__ = 'weather_observations'
    
    id = Column(Integer, primary_key=True, index=True)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    temperature = Column(Float)
    precipitation = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Terrain(Base):
    __tablename__ = 'terrain'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    elevation_m = Column(Float)
    geom = Column(Geometry(geometry_type='POLYGON', srid=4326))
