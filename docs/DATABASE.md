# Database Schema Documentation

This document describes the PostgreSQL/PostGIS database schema for NER-RAKSHA.

## ER Diagram (Text-based)

```text
+-------------------+       +-------------------+       +-------------------+
|     regions       |       |  road_segments    |       |    incidents      |
+-------------------+       +-------------------+       +-------------------+
| id (PK, Serial)   |       | id (PK, UUID)     |       | id (PK, UUID)     |
| name (Varchar)    |       | geom (LineString) |       | geom (Point)      |
| state (Varchar)   |       | type (Varchar)    |       | type (Varchar)    |
| geom (Polygon)    |       | risk_score (Int)  |       | severity (Int)    |
+-------------------+       | status (Varchar)  |       | active (Boolean)  |
                            | region_id (FK)    |       | reported_at (TS)  |
                            +-------------------+       +-------------------+
                                      |
                            +-------------------+
                            | weather_data      |
                            +-------------------+
                            | id (PK, UUID)     |
                            | segment_id (FK)   |
                            | rainfall_mm (Num) |
                            | forecast_ts (TS)  |
                            +-------------------+
```

## Tables Description

### 1. `regions` (Administrative Boundaries)
Stores district or state boundaries for high-level filtering.
*   `id`: Serial (Integer). Primary Key.
*   `name`: Varchar(255). Name of the region.
*   `state`: Varchar(255). Parent state.
*   `geom`: Geometry(Polygon, 4326). Spatial boundary.

### 2. `road_segments` (Network Topology)
The core road network graph.
*   `id`: UUID. Primary Key. Used for operational distributed creation.
*   `source_node`: BigInt. Routing topology node ID.
*   `target_node`: BigInt. Routing topology node ID.
*   `geom`: Geometry(LineString, 4326). The physical path of the road.
*   `length_m`: Float. Length in meters.
*   `road_type`: Varchar(50). (e.g., highway, residential).
*   `base_speed`: Integer. Speed limit in km/h.
*   `status`: Varchar(50). (OPEN, AT_RISK, SEVERELY_DISRUPTED, BLOCKED).
*   `current_risk_score`: Integer (0-100). Computed periodically.
*   `region_id`: Integer. Foreign key to `regions`.

### 3. `incidents` (Dynamic Disruptions)
Live reports of landslides, floods, blockages.
*   `id`: UUID. Primary Key.
*   `type`: Varchar(50). (LANDSLIDE, FLOOD, ACCIDENT, CONSTRUCTION).
*   `severity`: Integer (1-10).
*   `geom`: Geometry(Point, 4326). Location of the incident.
*   `description`: Text.
*   `active`: Boolean. True if currently ongoing.
*   `reported_at`: Timestamp.
*   `resolved_at`: Timestamp (Nullable).

### 4. `weather_data` (Forecasts)
Gridded or segment-mapped weather data.
*   `id`: UUID. Primary Key.
*   `segment_id`: UUID. Foreign key to `road_segments` (or point geometry if gridded).
*   `rainfall_mm_24h`: Float.
*   `forecast_time`: Timestamp.
*   `recorded_at`: Timestamp.

## Indexes

*   **Spatial Indexes (GIST):** Crucial for performance.
    *   `CREATE INDEX idx_road_segments_geom ON road_segments USING GIST (geom);`
    *   `CREATE INDEX idx_incidents_geom ON incidents USING GIST (geom);`
    *   `CREATE INDEX idx_regions_geom ON regions USING GIST (geom);`
*   **B-Tree Indexes:**
    *   `idx_incidents_active` on `incidents(active)` for fast filtering of current disruptions.
    *   `idx_road_segments_status` on `road_segments(status)`.

## Design Decisions

*   **PostGIS Geometry Types:** `Geometry(..., 4326)` (WGS 84) is used universally to match standard GPS coordinates and web mapping libraries (GeoJSON).
*   **UUID vs Serial:** `UUID` is used for operational records (`road_segments`, `incidents`) to allow distributed ingestion and avoid ID collision when merging data from different field nodes. `Serial` is used for static/lookup tables (`regions`) for simplicity and slight performance gain on joins where distribution is not a concern.
*   **Data Freshness Tracking:** The `incidents` and `weather_data` tables rely heavily on `reported_at`, `forecast_time`, and `active` flags. A background cleanup job will archive incidents that haven't been updated or manually resolved within a specific SLA (e.g., 48 hours).
