from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from app.database import Base
from datetime import datetime

class RiskPrediction(Base):
    __tablename__ = 'risk_predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, index=True)
    risk_score = Column(Float)
    risk_level = Column(String)
    factors = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

class MLModel(Base):
    __tablename__ = 'ml_models'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    version = Column(String)
    status = Column(String)
    deployed_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = 'alerts'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(String)
    severity = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class OperationalEvent(Base):
    __tablename__ = 'operational_events'
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DataSource(Base):
    __tablename__ = 'data_sources'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    status = Column(String)
    last_sync = Column(DateTime)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    user_id = Column(Integer, ForeignKey('users.id'))
    timestamp = Column(DateTime, default=datetime.utcnow)
