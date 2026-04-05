from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.db import get_db
from app.db.models import DroneTelemetry

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.get("/status")
def get_latest_telemetry(db: Session = Depends(get_db)):
    """Get the latest telemetry reading from the drone."""
    telemetry = db.query(DroneTelemetry).order_by(DroneTelemetry.timestamp.desc()).first()
    if not telemetry:
        raise HTTPException(status_code=404, detail="No telemetry data found.")
    return telemetry

@router.get("/history")
def get_telemetry_history(db: Session = Depends(get_db)):
    """Fetch last 50 telemetry records."""
    return db.query(DroneTelemetry).order_by(DroneTelemetry.timestamp.desc()).limit(50).all()
