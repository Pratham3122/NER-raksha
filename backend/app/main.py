"""
NER-RAKSHA FastAPI Application
Regional Logistics & Accessibility Command Center for Risk-Aware Transportation
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import asyncio
import json

from app.config import settings
from app.database import check_db_connection, check_postgis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ner_raksha")


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    logger.info("=" * 60)
    logger.info("NER-RAKSHA API Starting Up")
    logger.info(f"Version: {settings.app_version}")
    logger.info(f"Data Mode: {settings.data_mode.upper()}")
    logger.info(f"Routing Mode: {settings.routing_mode}")
    logger.info(f"ML Mode: {settings.ml_mode}")
    logger.info("=" * 60)

    # Check database
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("✓ Database connection: OK")
        postgis_ok = await check_postgis()
        if postgis_ok:
            logger.info("✓ PostGIS extension: OK")
        else:
            logger.warning("⚠ PostGIS extension not available")
    else:
        logger.error("✗ Database connection FAILED - check PostgreSQL is running")
        logger.error("  Run: docker-compose up -d")

    logger.info("NER-RAKSHA API ready at http://localhost:8000")
    logger.info("Swagger docs at http://localhost:8000/docs")

    yield

    logger.info("NER-RAKSHA API shutting down")


# Create FastAPI app
app = FastAPI(
    title="NER-RAKSHA API",
    description="""
## National Emergency Route & Logistics Risk Assessment

**Regional Logistics & Accessibility Command Center for Risk-Aware Transportation During Disasters**

This API powers the NER-RAKSHA decision-support command center, providing:
- Real-time road network status and risk assessment
- Multi-factor route planning with risk comparison
- Incident management and field reporting
- Vehicle tracking and GPS simulation
- Automated alert generation
- Demo mode for presentations

### Data Mode
The system can operate in LIVE, DEMO, MIXED, or OFFLINE modes.
All synthetic/demo data is clearly labeled.

### Route Risk Methodology
See [RISK_METHODOLOGY.md](../docs/RISK_METHODOLOGY.md) for full documentation.
    """,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Not found", "path": str(request.url.path)}
    )


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    logger.error(f"Server error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "Check server logs"}
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid input", "detail": str(exc)}
    )


# Health endpoint
@app.get("/health", tags=["Health"], summary="Basic health check")
async def health():
    """Basic health check. Returns immediately without DB queries."""
    return {
        "status": "ok",
        "service": "NER-RAKSHA API",
        "version": settings.app_version,
        "data_mode": settings.data_mode.upper(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# WebSocket for real-time dashboard updates
@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard updates.
    Sends periodic heartbeat and alerts.
    """
    await manager.connect(websocket)
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connected",
            "message": "NER-RAKSHA real-time feed connected",
            "data_mode": settings.data_mode.upper(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        # Keep connection alive with heartbeat
        while True:
            try:
                # Wait for client message (ping) or send heartbeat
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        manager.disconnect(websocket)
        logger.error(f"WebSocket error: {e}")


# Import and include all routers
try:
    from app.api.routes.dashboard import router as dashboard_router
    app.include_router(dashboard_router)
    logger.info("✓ Dashboard router loaded")
except Exception as e:
    logger.error(f"✗ Dashboard router failed: {e}")

try:
    from app.api.routes.roads import router as roads_router
    app.include_router(roads_router)
    logger.info("✓ Roads router loaded")
except Exception as e:
    logger.error(f"✗ Roads router failed: {e}")

try:
    from app.api.routes.incidents import router as incidents_router
    app.include_router(incidents_router)
    logger.info("✓ Incidents router loaded")
except Exception as e:
    logger.error(f"✗ Incidents router failed: {e}")

try:
    from app.api.routes.field_reports import router as field_reports_router
    app.include_router(field_reports_router)
    logger.info("✓ Field reports router loaded")
except Exception as e:
    logger.error(f"✗ Field reports router failed: {e}")

try:
    from app.api.routes.vehicles import router as vehicles_router
    app.include_router(vehicles_router)
    logger.info("✓ Vehicles router loaded")
except Exception as e:
    logger.error(f"✗ Vehicles router failed: {e}")

try:
    from app.api.routes.deliveries import router as deliveries_router
    app.include_router(deliveries_router)
    logger.info("✓ Deliveries router loaded")
except Exception as e:
    logger.error(f"✗ Deliveries router failed: {e}")

try:
    from app.api.routes.alerts import router as alerts_router
    app.include_router(alerts_router)
    logger.info("✓ Alerts router loaded")
except Exception as e:
    logger.error(f"✗ Alerts router failed: {e}")

try:
    from app.api.routes.events import router as events_router
    app.include_router(events_router)
    logger.info("✓ Events router loaded")
except Exception as e:
    logger.error(f"✗ Events router failed: {e}")

try:
    from app.api.routes.risk import router as risk_router
    app.include_router(risk_router)
    logger.info("✓ Risk router loaded")
except Exception as e:
    logger.error(f"✗ Risk router failed: {e}")

try:
    from app.api.routes.routes_ import router as routes_router
    app.include_router(routes_router)
    logger.info("✓ Routes router loaded")
except Exception as e:
    logger.error(f"✗ Routes router failed: {e}")

try:
    from app.api.routes.system import router as system_router
    app.include_router(system_router)
    logger.info("✓ System router loaded")
except Exception as e:
    logger.error(f"✗ System router failed: {e}")

try:
    from app.api.routes.data_sources import router as data_sources_router
    app.include_router(data_sources_router)
    logger.info("✓ Data sources router loaded")
except Exception as e:
    logger.error(f"✗ Data sources router failed: {e}")

try:
    from app.api.routes.demo import router as demo_router
    app.include_router(demo_router)
    logger.info("✓ Demo router loaded")
except Exception as e:
    logger.error(f"✗ Demo router failed: {e}")

try:
    from app.api.routes.analytics import router as analytics_router
    app.include_router(analytics_router)
    logger.info("✓ Analytics router loaded")
except Exception as e:
    logger.error(f"✗ Analytics router failed: {e}")
