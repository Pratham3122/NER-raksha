<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-alert.svg" alt="Logo" width="80" height="80">
  <h1 align="center">NER-RAKSHA</h1>
  
  <p align="center">
    <strong>Regional Logistics & Accessibility Command Center for Northeast India</strong>
    <br />
    <br />
    <a href="#features">Features</a>
    ·
    <a href="#architecture">Architecture</a>
    ·
    <a href="#getting-started">Getting Started</a>
    ·
    <a href="#api">API Documentation</a>
  </p>
</div>

---

## 🏔️ Overview

**NER-RAKSHA** is an intelligent, risk-aware routing and logistics command center engineered specifically for the challenging terrain and volatile weather conditions of Northeast India. During severe infrastructure disruptions (landslides, floods, bridge collapses), NER-RAKSHA enables operational commanders, emergency responders, and supply chain managers to maintain critical supply lines.

The platform continuously evaluates road conditions, integrates real-time incident reports, and calculates risk profiles for highway segments to ensure the safest and most efficient routing of essential personnel and cargo.

## ✨ Features

- **🛡️ Risk-Aware Routing**: Dynamically routes vehicles around active hazards using OSRM, prioritizing the safest paths for critical cargo.
- **📡 Real-Time Command Center**: A unified operational map (Dark Mode / High Contrast) rendering active routes, vehicle telemetry, and live hazard data.
- **🚨 Incident Management**: Ingest field reports (landslides, flooding, road damage) and immediately invalidate affected road segments across the entire network.
- **🚚 Fleet & Delivery Tracking**: Track vehicle status, cargo priority, and expected delays with predictive ETA adjustments.
- **📊 Operational Dashboard**: Real-time KPI metrics tracking network health, active vehicles, and critical supply delivery status.
- **🌐 Offline & Demo Resiliency**: Built-in fallback systems ensure the dashboard and maps continue operating via synthetic data even if live PostGIS databases or internet connectivity drops.

## 🏗️ Architecture Stack

### Frontend
- **Framework**: React 18 with TypeScript (built via Vite)
- **Styling**: Tailwind CSS for a premium, dark-mode-first aesthetic
- **Mapping**: Leaflet + `react-leaflet` with Wikimedia/OSM Int Tiles (Custom Dark Filter)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python) - High performance, asynchronous API
- **Database**: PostgreSQL with PostGIS extension for spatial querying (Dockerized)
- **Routing**: Open Source Routing Machine (OSRM) integration

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Docker & Docker Compose (for PostgreSQL/PostGIS)

### 1. Start the Database
```bash
docker-compose up -d
```
*Note: The app will run in `DEMO` mode automatically if the database is unavailable.*

### 2. Setup the Backend API
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Setup the Frontend Client
```bash
cd frontend
npm install
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## 🗺️ Routing Methodology

NER-RAKSHA does not just calculate the fastest route; it calculates the *safest* route. The internal routing engine weighs parameters heavily biased towards survival and arrival guarantee:

- **FASTEST**: Minimizes travel time. May traverse High-Risk segments (amber/orange).
- **SAFEST**: Avoids all `AT_RISK` and `SEVERELY_DISRUPTED` segments, guaranteeing passage even if travel time increases significantly.
- **BALANCED**: A 50/50 weighted combination of travel time and structural road risk.

---
<div align="center">
  <i>Engineered for resilience. Built for Northeast India.</i>
</div>
