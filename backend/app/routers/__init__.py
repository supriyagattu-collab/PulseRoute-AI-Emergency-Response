from fastapi import APIRouter
from app.routers.health import router as health_router
from app.routers.emergencies import router as emergencies_router
from app.routers.ambulances import router as ambulances_router
from app.routers.facilities import router as facilities_router
from app.routers.assignments import router as assignments_router
from app.routers.routing import router as routing_router
from app.routers.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(emergencies_router)
api_router.include_router(ambulances_router)
api_router.include_router(facilities_router)
api_router.include_router(assignments_router)
api_router.include_router(routing_router)
api_router.include_router(auth_router)
