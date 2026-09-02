export type DataMode = 'LIVE' | 'DEMO' | 'MIXED' | 'OFFLINE';
export type RoadStatus = 'OPEN' | 'AT_RISK' | 'SEVERELY_DISRUPTED' | 'BLOCKED' | 'UNKNOWN';
export type RoadCondition = 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR' | 'UNKNOWN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentType = 'FLOOD' | 'LANDSLIDE' | 'ROAD_DAMAGE' | 'BRIDGE_DAMAGE' | 'ACCIDENT' | 'TRAFFIC' | 'CLOSURE' | 'OTHER';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
export type VehicleType = 'TRUCK' | 'VAN' | 'AMBULANCE' | 'RESCUE' | 'SUV' | 'MOTORCYCLE' | 'HELICOPTER';
export type VehicleStatus = 'MOVING' | 'STOPPED' | 'DELAYED' | 'AT_RISK' | 'REROUTING' | 'ARRIVED' | 'OFFLINE';
export type CargoPriority = 'NORMAL' | 'IMPORTANT' | 'CRITICAL';
export type DeliveryStatus = 'PLANNED' | 'IN_TRANSIT' | 'DELAYED' | 'REROUTED' | 'DELIVERED' | 'CANCELLED';
export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type MissionType = 'GENERAL' | 'MEDICAL' | 'FOOD' | 'RESCUE' | 'PERSONNEL' | 'CRITICAL_SUPPLIES';
export type PriorityMode = 'FASTEST' | 'BALANCED' | 'SAFEST';

export interface GeoPoint { lat: number; lon: number; }

export interface DashboardSummary {
  data_mode: DataMode;
  timestamp: string;
  roads: {
    total: number; open: number; at_risk: number; disrupted: number; blocked: number;
    avg_risk_score: number;
  };
  incidents: { pending_verification: number; active_24h: number; critical_active: number; };
  alerts: { active: number; critical: number; };
  vehicles: { total: number; in_transit: number; at_risk: number; };
  deliveries: { in_transit: number; delayed: number; rerouted: number; critical_active: number; };
  recent_events: OperationalEvent[];
}

export interface Road {
  id: number;
  name: string;
  road_class: string;
  district_id: number;
  district_name?: string;
  status: RoadStatus;
  risk_score: number;
  risk_level: RiskLevel;
  condition: RoadCondition;
  surface?: string;
  bridge?: boolean;
  speed_kmh?: number;
  incident_count?: number;
  last_updated?: string;
}

export interface RoadSegment {
  id: number;
  road_id: number;
  status: RoadStatus;
  risk_score: number;
  risk_level: RiskLevel;
  condition: RoadCondition;
  length_m: number;
  speed_kmh?: number;
  geometry?: GeoJSONLineString;
  is_demo: boolean;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description?: string;
  location: GeoPoint;
  district_name?: string;
  road_segment_id?: number;
  reporter_name?: string;
  photo_url?: string;
  verified_by?: string;
  verification_notes?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  cargo_type?: string;
  cargo_priority: CargoPriority;
  current_position?: GeoPoint;
  current_speed_kmh: number;
  status: VehicleStatus;
  heading_deg?: number;
  is_simulated: boolean;
}

export interface Delivery {
  id: string;
  vehicle_id: string;
  cargo: string;
  cargo_priority: CargoPriority;
  origin_name: string;
  destination_name: string;
  origin: GeoPoint;
  destination: GeoPoint;
  scheduled_arrival?: string;
  estimated_arrival?: string;
  delay_minutes: number;
  status: DeliveryStatus;
  risk_level: RiskLevel;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
  status: AlertStatus;
  related_road_id?: number;
  related_vehicle_id?: string;
  related_incident_id?: string;
  related_delivery_id?: string;
  created_at: string;
  acknowledged_at?: string;
}

export interface OperationalEvent {
  id: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  severity: AlertSeverity;
  created_at: string;
}

export interface RouteOption {
  id: string;
  option_number: number;
  label: string;
  is_recommended: boolean;
  geometry: GeoJSONLineString;
  distance_m: number;
  duration_s: number;
  risk_score: number;
  risk_level: RiskLevel;
  blocked_segments: number;
  high_risk_segments: number;
  expected_delay_s: number;
  explanation: string;
}

export interface RoutePlanRequest {
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  origin_name?: string;
  destination_name?: string;
  mission_type: MissionType;
  cargo_priority: CargoPriority;
  priority_mode: PriorityMode;
  vehicle_id?: string;
}

export interface RoutePlanResponse {
  options: RouteOption[];
  recommended_option_id: string;
  why_not_fastest?: string;
  comparison: RouteComparison[];
  data_mode: string;
}

export interface RouteComparison {
  label: string;
  distance_m: number;
  duration_s: number;
  risk_score: number;
  risk_level: RiskLevel;
  expected_delay_s: number;
  blocked_segments: number;
  high_risk_segments: number;
  is_recommended: boolean;
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface SystemHealth {
  overall: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  database: ComponentHealth;
  api: ComponentHealth;
  gis: ComponentHealth;
  routing: ComponentHealth;
  ml: ComponentHealth;
  alert_engine: ComponentHealth;
  gps_simulator: ComponentHealth;
}

export interface ComponentHealth {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  message?: string;
  latency_ms?: number;
}

export interface DataSource {
  id: number;
  name: string;
  dataset: string;
  url?: string;
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
  last_updated?: string;
  mode: DataMode;
  coverage?: string;
  refresh_interval?: string;
  notes?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
