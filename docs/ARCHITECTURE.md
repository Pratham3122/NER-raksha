# NER-RAKSHA Architecture

## System Overview

NER-RAKSHA (Northeast India Regional Logistics & Accessibility Command Center for Risk-Aware Transportation) is a decision-support system designed to optimize logistics and routing in challenging terrains under dynamic risk conditions (weather, disasters, road blockages).

## Component Diagram

```
[ Frontend: React/Vite/Leaflet ] <---(REST/WebSocket)---> [ API: FastAPI ]
                                                               |
                                                               v
[ External APIs ] <---(Data Ingestion/Cron)---> [ DB: PostgreSQL / PostGIS ]
(Meteo, OSM, etc)                                              |
                                                               v
                                                [ ML / Risk Engine (Python) ]
```

## Data Flow

1.  **Field/External Ingestion**: Cron jobs or celery workers fetch data from external APIs (Weather, Incidents).
2.  **Database**: Data is cleaned, geographically indexed, and stored in PostGIS.
3.  **Risk Engine**: Runs periodically or on-demand to compute risk scores for road segments based on static and dynamic data.
4.  **API**: FastAPI serves endpoints for routing requests, map tile data, and incident reports.
5.  **Frontend**: React application visualizes data using Leaflet and allows users to request and compare routes.

## Technology Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, TypeScript | Modern, fast, type-safe UI development. |
| **Map/GIS Client** | Leaflet, react-leaflet | Lightweight, excellent for rendering GeoJSON and tiles. |
| **Backend API** | FastAPI (Python) | High performance, async support, auto-generating OpenAPI docs. |
| **Database** | PostgreSQL + PostGIS | Industry standard for spatial data and complex geographic queries. |
| **Routing Engine** | pgRouting (Internal) / OSRM (External) | pgRouting allows dynamic cost adjustments based on risk; OSRM for baseline speed. |
| **Data Processing** | Pandas, GeoPandas, Shapely | Python ecosystem standard for spatial data manipulation. |
| **Containerization**| Docker, Docker Compose | Consistent deployment environments. |

## Service Boundaries

*   **Ingestion Service**: Responsible solely for fetching and normalizing external data.
*   **Core API Service**: Handles business logic, user requests, and routing coordination.
*   **Routing Service**: Dedicated engine for pathfinding (can be integrated in DB via pgRouting or a separate microservice).

## Database Layer (PostGIS)

PostgreSQL with the PostGIS extension is the core data store. It handles spatial indexing (GIST) for fast bounding box queries, point-in-polygon checks, and distance calculations. The schema relies heavily on `geometry(Point, 4326)` and `geometry(LineString, 4326)` types.

## API Layer (FastAPI)

Built with FastAPI for asynchronous request handling. Endpoints are organized into:
*   `/routes`: For pathfinding requests.
*   `/incidents`: CRUD operations for disruptions.
*   `/weather`: Weather data access.
*   `/meta`: System status and configuration.

## Frontend Layer (React/Vite)

A Single Page Application (SPA) providing a dashboard view. Key features:
*   Interactive map with layers for weather, incidents, and road network.
*   Routing panel to input start/end points and select routing strategy (Fastest, Balanced, Safest).
*   Visual comparison of route options.

## GIS Layer (Leaflet + PostGIS)

PostGIS handles the heavy lifting of spatial queries (e.g., finding incidents within 5km of a route). Leaflet is used purely for visualization, consuming GeoJSON features produced by the API.

## Routing Abstraction (RoutingEngine Interface)

The system abstracts the routing implementation via a `RoutingEngine` interface. This allows swapping between:
1.  **OSRM**: Fast, static routing (baseline).
2.  **pgRouting**: Slower, highly dynamic risk-aware routing using custom SQL cost functions.

## Risk Engine Design

The Risk Engine is a modular Python component that calculates a composite score for spatial segments. It aggregates factors like rainfall severity, slope, and proximity to active incidents.

## ML Pipeline

Currently designed as a future integration point. The ML model will predict disruption probability based on historical data. When active, its predictions will seamlessly replace or augment the static heuristic weights in the Risk Engine.

## Demo Mode Architecture

To facilitate easy demonstrations, the system includes a "Demo Mode" which:
*   Bypasses live external APIs in favor of local mock data (JSON fixtures).
*   Uses a simplified in-memory routing heuristic if PostGIS/pgRouting is unavailable.

## WebSocket for Real-time Updates

(Planned) WebSockets will push live incident updates to the frontend, allowing the dashboard to reflect road blockages immediately without polling.

## Security Considerations

*   API endpoints validated using Pydantic schemas.
*   CORS configured strictly.
*   (Future) JWT-based authentication for operators.
*   SQL injection prevented via ORM/parameterized queries.

## Deployment Architecture

Docker Compose is used to orchestrate the stack:
*   `db`: PostgreSQL container with PostGIS.
*   `api`: FastAPI application container.
*   `web`: Nginx container serving the built React static files.
