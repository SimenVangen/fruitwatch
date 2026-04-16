from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.db import get_db
from app.db.models import SensorReading, Farm
from app.core.dependencies import get_current_user
from app.db.models import User

router = APIRouter(tags=["Sensors"])


class SensorReadingSchema(BaseModel):
    farm_id:     int
    temperature: Optional[float] = None
    humidity:    Optional[float] = None
    token:       Optional[str]   = None  # simple device token for Pi5 auth


@router.post("/reading")
def post_sensor_reading(
    data: SensorReadingSchema,
    db: Session = Depends(get_db),
):
    """
    Receive a sensor reading from the Pi5.
    Called by the Pi5 sensor script every 30 seconds.
    Uses a simple device token instead of JWT for ease of use on the Pi.
    """
    # Verify farm exists
    farm = db.query(Farm).filter(Farm.id == data.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    reading = SensorReading(
        farm_id=data.farm_id,
        temperature=data.temperature,
        humidity=data.humidity,
        timestamp=datetime.utcnow(),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    print(f"🌡️  Sensor reading saved — Farm {data.farm_id}: {data.temperature}°C, {data.humidity}%")

    return {
        "id":          reading.id,
        "farm_id":     reading.farm_id,
        "temperature": reading.temperature,
        "humidity":    reading.humidity,
        "timestamp":   reading.timestamp.isoformat(),
    }


@router.get("/latest/{farm_id}")
def get_latest_reading(
    farm_id: int,
    db: Session = Depends(get_db),
):
    """
    Get the most recent sensor reading for a farm.
    Called by the dashboard to show live temperature + humidity.
    """
    reading = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id
    ).order_by(SensorReading.timestamp.desc()).first()

    if not reading:
        return {
            "farm_id":     farm_id,
            "temperature": None,
            "humidity":    None,
            "timestamp":   None,
        }

    return {
        "farm_id":     reading.farm_id,
        "temperature": reading.temperature,
        "humidity":    reading.humidity,
        "timestamp":   reading.timestamp.isoformat(),
    }


@router.get("/history/{farm_id}")
def get_sensor_history(
    farm_id: int,
    limit: int = 48,
    db: Session = Depends(get_db),
):
    """
    Get last N sensor readings for a farm.
    Used for temperature/humidity charts.
    Default 48 readings = 24 hours at 30min intervals.
    """
    readings = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id
    ).order_by(SensorReading.timestamp.desc()).limit(limit).all()

    return [
        {
            "temperature": r.temperature,
            "humidity":    r.humidity,
            "timestamp":   r.timestamp.isoformat(),
        }
        for r in reversed(readings)  # oldest first for charts
    ]