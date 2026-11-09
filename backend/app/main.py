"""
Main FastAPI Application Entrypoint for PulseRoute Emergency Response System.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.auth.seed import seed_demo_users
# Import all models to ensure they register on Base.metadata
from app.models import (
    HealthcareFacility,
    Ambulance,
    EmergencyReport,
    EmergencyStatusHistory,
    AmbulanceAssignment,
    User,
    RefreshToken,
)
from app.routers import api_router
from app.websocket.router import ws_router
from app.websocket.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager:
    Initializes database tables on application startup.
    """
    try:
        Base.metadata.create_all(bind=engine)
        if settings.DEMO_MODE:
            db = SessionLocal()
            try:
                seed_demo_users(db)
            finally:
                db.close()
    except Exception as exc:
        print(f"Warning during automatic table initialization: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## 🚑 PulseRoute AI Emergency Response & Routing System API (Milestone 4)

    ### ⚠️ Academic Prototype & Safety Notice
    - **College Project Prototype:** Built for engineering demonstration and evaluation.
    - **NOT a real emergency dispatch service.**
    - All telemetry, hospital bed capacities, and ambulance dispatch events are simulated.
    - In an actual emergency in India, please call **108** or **112**.

    ### Core Capabilities
    - 🆘 **Emergency Reports:** Intake, triage classification, and status transitions.
    - 🚑 **Ambulance Fleet:** State updates, speed, and real-time proximity discovery.
    - 🏥 **Healthcare Facilities:** Telangana healthcare facilities database search and AI recommendations.
    - 📋 **Dispatch Assignments:** Automated ambulance matching and lifecycle coordination.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration for local React + Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register versioned API router (/api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Register WebSocket router at root level (ws://localhost:8000/ws/live)
app.include_router(ws_router)


@app.get("/", include_in_schema=False)
def root():
    """
    Redirect root path to interactive Swagger documentation.
    """
    return RedirectResponse(url="/docs")


@app.get("/ws/status", tags=["WebSocket"], summary="WebSocket connection count")
def websocket_status():
    """
    Returns the number of currently active WebSocket clients.
    Useful for health checks and admin monitoring.
    """
    return {
        "active_websocket_connections": manager.active_count,
        "websocket_endpoint": "ws://localhost:8000/ws/live",
    }
