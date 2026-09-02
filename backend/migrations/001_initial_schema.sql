-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ENUMs
CREATE TYPE road_status AS ENUM ('OPEN', 'AT_RISK', 'SEVERELY_DISRUPTED', 'BLOCKED', 'UNKNOWN');
CREATE TYPE road_condition AS ENUM ('GOOD', 'FAIR', 'POOR', 'VERY_POOR', 'UNKNOWN');
CREATE TYPE incident_type AS ENUM ('FLOOD', 'LANDSLIDE', 'ROAD_DAMAGE', 'BRIDGE_DAMAGE', 'ACCIDENT', 'TRAFFIC', 'CLOSURE', 'OTHER');
CREATE TYPE incident_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE incident_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED');
CREATE TYPE vehicle_type AS ENUM ('TRUCK', 'VAN', 'AMBULANCE', 'RESCUE', 'SUV', 'MOTORCYCLE', 'HELICOPTER');
CREATE TYPE vehicle_status AS ENUM ('MOVING', 'STOPPED', 'DELAYED', 'AT_RISK', 'REROUTING', 'ARRIVED', 'OFFLINE');
CREATE TYPE cargo_priority AS ENUM ('NORMAL', 'IMPORTANT', 'CRITICAL');
CREATE TYPE delivery_status AS ENUM ('PLANNED', 'IN_TRANSIT', 'DELAYED', 'REROUTED', 'DELIVERED', 'CANCELLED');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE alert_severity AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE alert_type AS ENUM ('NEW_INCIDENT', 'ROAD_BLOCKED', 'RISK_INCREASED', 'VEHICLE_APPROACHING_RISK', 'DELIVERY_DELAY', 'ROUTE_INTERRUPTED', 'HIGH_DISRUPTION_PREDICTION', 'SEVERE_WEATHER', 'SYSTEM');
CREATE TYPE alert_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE route_status AS ENUM ('ACTIVE', 'COMPLETED', 'INVALIDATED', 'CANCELLED');
CREATE TYPE data_mode AS ENUM ('LIVE', 'DEMO', 'MIXED', 'OFFLINE');
CREATE TYPE data_source_status AS ENUM ('AVAILABLE', 'DEGRADED', 'UNAVAILABLE', 'UNKNOWN');

-- Tables

CREATE TABLE states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code CHAR(2) UNIQUE,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT REFERENCES states(id),
    geom GEOMETRY(MultiPolygon, 4326),
    population INT,
    area_sqkm FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    osm_id BIGINT,
    road_class VARCHAR(50),
    surface VARCHAR(50),
    access VARCHAR(50),
    maxspeed_kmh INT,
    bridge BOOLEAN DEFAULT FALSE,
    tunnel BOOLEAN DEFAULT FALSE,
    district_id INT REFERENCES districts(id),
    geom GEOMETRY(LineString, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE road_segments (
    id SERIAL PRIMARY KEY,
    road_id INT REFERENCES roads(id),
    sequence INT,
    geom GEOMETRY(LineString, 4326),
    length_m FLOAT,
    status road_status DEFAULT 'OPEN',
    risk_score FLOAT DEFAULT 0,
    risk_level risk_level DEFAULT 'LOW',
    condition road_condition DEFAULT 'GOOD',
    speed_kmh FLOAT,
    weather_risk FLOAT DEFAULT 0,
    terrain_risk FLOAT DEFAULT 0,
    incident_risk FLOAT DEFAULT 0,
    historical_risk FLOAT DEFAULT 0,
    last_risk_calculated TIMESTAMPTZ,
    last_status_updated TIMESTAMPTZ,
    data_source VARCHAR(100) DEFAULT 'DEMO',
    is_demo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE road_conditions (
    id SERIAL PRIMARY KEY,
    segment_id INT REFERENCES road_segments(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    condition road_condition,
    source VARCHAR(100),
    confidence FLOAT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weather_observations (
    id SERIAL PRIMARY KEY,
    district_id INT REFERENCES districts(id),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    observed_at TIMESTAMPTZ NOT NULL,
    rainfall_mm FLOAT DEFAULT 0,
    temperature_c FLOAT,
    humidity_pct FLOAT,
    wind_speed_kmh FLOAT,
    weather_code INT,
    source VARCHAR(100) DEFAULT 'open_meteo',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE terrain (
    id SERIAL PRIMARY KEY,
    district_id INT REFERENCES districts(id),
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    elevation_m FLOAT,
    slope_pct FLOAT,
    terrain_class VARCHAR(50),
    source VARCHAR(100) DEFAULT 'NASA_SRTM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incidents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type incident_type NOT NULL,
    severity incident_severity NOT NULL,
    status incident_status DEFAULT 'PENDING',
    location GEOMETRY(Point, 4326) NOT NULL,
    district_id INT REFERENCES districts(id),
    road_segment_id INT REFERENCES road_segments(id),
    title VARCHAR(200),
    description TEXT,
    photo_url VARCHAR(500),
    reporter_name VARCHAR(100),
    reporter_contact VARCHAR(100),
    device_id VARCHAR(100),
    field_report_id UUID,
    verified_by UUID,
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    source VARCHAR(100) DEFAULT 'FIELD_REPORT',
    is_demo BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE field_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    incident_id UUID REFERENCES incidents(id),
    location GEOMETRY(Point, 4326) NOT NULL,
    type incident_type NOT NULL,
    severity incident_severity NOT NULL,
    description TEXT,
    photo_url VARCHAR(500),
    reporter_name VARCHAR(100),
    device_id VARCHAR(100),
    status incident_status DEFAULT 'PENDING',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100),
    type vehicle_type NOT NULL,
    cargo_type VARCHAR(100),
    cargo_priority cargo_priority DEFAULT 'NORMAL',
    current_position GEOMETRY(Point, 4326),
    current_speed_kmh FLOAT DEFAULT 0,
    heading_deg FLOAT,
    status vehicle_status DEFAULT 'STOPPED',
    current_route_id UUID,
    district_id INT REFERENCES districts(id),
    is_demo BOOLEAN DEFAULT TRUE,
    is_simulated BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_positions (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id VARCHAR(20) REFERENCES vehicles(id),
    position GEOMETRY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    speed_kmh FLOAT,
    heading_deg FLOAT,
    altitude_m FLOAT,
    accuracy_m FLOAT,
    is_simulated BOOLEAN DEFAULT TRUE
);

CREATE TABLE deliveries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_id VARCHAR(20) REFERENCES vehicles(id),
    cargo VARCHAR(200) NOT NULL,
    cargo_priority cargo_priority DEFAULT 'NORMAL',
    origin GEOMETRY(Point, 4326) NOT NULL,
    destination GEOMETRY(Point, 4326) NOT NULL,
    origin_name VARCHAR(200),
    destination_name VARCHAR(200),
    scheduled_departure TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    scheduled_arrival TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    delay_minutes FLOAT DEFAULT 0,
    status delivery_status DEFAULT 'PLANNED',
    risk_level risk_level DEFAULT 'LOW',
    notes TEXT,
    is_demo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_id VARCHAR(20) REFERENCES vehicles(id),
    delivery_id UUID REFERENCES deliveries(id),
    origin GEOMETRY(Point, 4326) NOT NULL,
    destination GEOMETRY(Point, 4326) NOT NULL,
    origin_name VARCHAR(200),
    destination_name VARCHAR(200),
    geometry GEOMETRY(LineString, 4326),
    status route_status DEFAULT 'ACTIVE',
    risk_score FLOAT DEFAULT 0,
    risk_level risk_level DEFAULT 'LOW',
    distance_m FLOAT,
    duration_s FLOAT,
    expected_delay_s FLOAT DEFAULT 0,
    blocked_segments INT DEFAULT 0,
    high_risk_segments INT DEFAULT 0,
    routing_mode VARCHAR(50) DEFAULT 'demo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    invalidated_at TIMESTAMPTZ,
    invalidation_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE route_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id VARCHAR(100),
    option_number INT,
    geometry GEOMETRY(LineString, 4326),
    distance_m FLOAT,
    duration_s FLOAT,
    risk_score FLOAT,
    risk_level risk_level,
    blocked_segments INT DEFAULT 0,
    high_risk_segments INT DEFAULT 0,
    explanation TEXT,
    why_recommended TEXT,
    label VARCHAR(50),
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE risk_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    segment_id INT REFERENCES road_segments(id),
    predicted_at TIMESTAMPTZ DEFAULT NOW(),
    disruption_probability FLOAT,
    risk_score FLOAT,
    risk_level risk_level,
    model_version VARCHAR(50),
    features JSONB,
    is_demo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ml_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    algorithm VARCHAR(100),
    accuracy FLOAT,
    precision_score FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    roc_auc FLOAT,
    pr_auc FLOAT,
    trained_at TIMESTAMPTZ,
    feature_names JSONB,
    training_samples INT,
    test_samples INT,
    notes TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    data_source VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    severity alert_severity NOT NULL,
    type alert_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    location GEOMETRY(Point, 4326),
    related_road_id INT REFERENCES roads(id),
    related_segment_id INT REFERENCES road_segments(id),
    related_vehicle_id VARCHAR(20) REFERENCES vehicles(id),
    related_incident_id UUID REFERENCES incidents(id),
    related_delivery_id UUID REFERENCES deliveries(id),
    related_route_id UUID REFERENCES routes(id),
    status alert_status DEFAULT 'ACTIVE',
    dedup_key VARCHAR(200),
    acknowledged_by VARCHAR(100),
    resolved_by VARCHAR(100),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE operational_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    metadata JSONB,
    severity alert_severity DEFAULT 'INFO',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dataset VARCHAR(100) NOT NULL,
    url VARCHAR(500),
    status data_source_status DEFAULT 'UNKNOWN',
    last_checked TIMESTAMPTZ,
    last_updated TIMESTAMPTZ,
    mode data_mode DEFAULT 'DEMO',
    coverage VARCHAR(200),
    refresh_interval VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    email VARCHAR(200) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial indexes
CREATE INDEX idx_states_geom ON states USING GIST(geom);
CREATE INDEX idx_districts_geom ON districts USING GIST(geom);
CREATE INDEX idx_roads_geom ON roads USING GIST(geom);
CREATE INDEX idx_road_segments_geom ON road_segments USING GIST(geom);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_vehicles_position ON vehicles USING GIST(current_position);
CREATE INDEX idx_vehicle_positions_pos ON vehicle_positions USING GIST(position);
CREATE INDEX idx_deliveries_origin ON deliveries USING GIST(origin);
CREATE INDEX idx_deliveries_dest ON deliveries USING GIST(destination);
CREATE INDEX idx_routes_geom ON routes USING GIST(geometry);
CREATE INDEX idx_alerts_location ON alerts USING GIST(location);

-- Regular indexes
CREATE INDEX idx_road_segments_road_id ON road_segments(road_id);
CREATE INDEX idx_road_segments_status ON road_segments(status);
CREATE INDEX idx_road_segments_risk ON road_segments(risk_score);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_district ON incidents(district_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_vehicle ON deliveries(vehicle_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_dedup ON alerts(dedup_key) WHERE dedup_key IS NOT NULL;
CREATE INDEX idx_operational_events_created ON operational_events(created_at);
CREATE INDEX idx_vehicle_positions_vehicle ON vehicle_positions(vehicle_id);
CREATE INDEX idx_vehicle_positions_time ON vehicle_positions(recorded_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_road_segments_updated_at BEFORE UPDATE ON road_segments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
