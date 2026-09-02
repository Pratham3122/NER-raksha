from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

# Project root = parent of backend/
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    
    # App
    app_name: str = 'NER-RAKSHA API'
    app_version: str = '1.0.0'
    debug: bool = True
    
    # Database
    database_url: str = 'postgresql+asyncpg://ner_user:ner_secure_2024@localhost:5432/ner_raksha'
    database_url_sync: str = 'postgresql://ner_user:ner_secure_2024@localhost:5432/ner_raksha'
    
    # API
    api_host: str = '0.0.0.0'
    api_port: int = 8000
    secret_key: str = 'change-this-in-production'
    
    # CORS
    cors_origins: List[str] = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080']
    
    # Routing
    routing_mode: str = 'demo'  # osrm, openrouteservice, demo
    osrm_url: str = 'http://router.project-osrm.org'
    openrouteservice_url: str = 'https://api.openrouteservice.org/v2'
    openrouteservice_api_key: str = ''
    
    # Weather
    weather_mode: str = 'open_meteo'
    open_meteo_url: str = 'https://api.open-meteo.com/v1'
    
    # ML - defaults to absolute path in project root
    ml_model_path: str = os.path.join(_PROJECT_ROOT, 'models', 'disruption_model.joblib')
    ml_mode: str = 'active'
    
    # Demo
    demo_mode: bool = False
    demo_region_lat: float = 26.1445
    demo_region_lon: float = 91.7362
    
    # Data
    data_mode: str = 'demo'  # live, demo, mixed

settings = Settings()

