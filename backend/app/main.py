import sys
import os
from contextlib import asynccontextmanager

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
sys.path.append(ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.routes import (
    detections, 
    farm_route, 
    forecast, 
    sensors,
    mission_route, 
    health_route, 
    moisture_route, 
    telemetry_route,
    summary_route
)



from app.auth import router
from app.db.db import init_db

import logging

app = FastAPI(title="Fruit Monitoring API")

logger = logging.getLogger(__name__)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(router)
app.include_router(detections.router, prefix="/detections")
app.include_router(sensors.router, prefix="/sensors")
app.include_router(forecast.router, prefix="/forecast")
app.include_router(mission_route.router, prefix="/missions")
app.include_router(health_route.router, prefix="/health-metrics")
app.include_router(moisture_route.router, prefix="/moisture")
app.include_router(telemetry_route.router, prefix="/telemetry")
app.include_router(farm_route.router, prefix="/farms")
app.include_router(summary_route.router, prefix="/summary")

@app.get("/")
async def root():
    return {"message": "Fruit Monitoring API"}

@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("🚀 Server started successfully")

@app.get("/debug-routes")
async def debug_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": getattr(route, "name", "Unknown")
            })
    return {"registered_routes": routes}