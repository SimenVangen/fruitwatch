from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.db import get_db
from app.db.models import SoilMoisture

router = APIRouter(prefix="/moisture", tags=["Moisture"])


@router.get("/current/{farm_id}")
def get_current_moisture(farm_id: int, db: Session = Depends(get_db)):
    data = (
        db.query(SoilMoisture)
        .filter(SoilMoisture.farm_id == farm_id)
        .order_by(SoilMoisture.timestamp.desc())
        .limit(10)
        .all()
    )

    if not data:
        raise HTTPException(status_code=404, detail="No moisture data found.")

    return [
        {
            "id": d.id,
            "farm_id": d.farm_id,
            "zone": d.zone,
            "moisture_percent": d.moisture_percent,
            "timestamp": d.timestamp
        }
        for d in data
    ]


@router.get("/alerts/{farm_id}")
def get_moisture_alerts(farm_id: int, db: Session = Depends(get_db)):
    data = (
        db.query(SoilMoisture)
        .filter(SoilMoisture.farm_id == farm_id)
        .order_by(SoilMoisture.timestamp.desc())
        .limit(10)
        .all()
    )

    alerts = []

    for zone in data:
        if zone.moisture_percent is not None and zone.moisture_percent < 25:
            alerts.append({
                "zone": zone.zone,
                "moisture": zone.moisture_percent,
                "message": "Irrigation required"
            })

    return {
        "alerts": alerts if alerts else ["✅ All zones adequately watered."]
    }