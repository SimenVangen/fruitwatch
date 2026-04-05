from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.models import HealthMetric
from app.db.db import get_db

router = APIRouter(prefix="/health-metrics", tags=["Health Metrics"])


@router.get("/history/{farm_id}")
def get_health_history(farm_id: int, db: Session = Depends(get_db)):
    metrics = (
        db.query(HealthMetric)
        .filter(HealthMetric.farm_id == farm_id)
        .order_by(HealthMetric.timestamp.desc())
        .limit(100)
        .all()
    )

    if not metrics:
        raise HTTPException(status_code=404, detail="No health metrics found.")

    return [
        {
            "id": m.id,
            "farm_id": m.farm_id,
            "avg_health": m.avg_health,
            "timestamp": m.timestamp
        }
        for m in metrics
    ]


@router.get("/alerts/{farm_id}")
def get_health_alerts(farm_id: int, db: Session = Depends(get_db)):
    metrics = (
        db.query(HealthMetric)
        .filter(HealthMetric.farm_id == farm_id)
        .order_by(HealthMetric.timestamp.desc())
        .limit(2)
        .all()
    )

    if len(metrics) < 2:
        return {"alert": "Insufficient data."}

    latest, prev = metrics

    if not prev.avg_health:
        return {"alert": "No valid previous data."}

    drop = ((prev.avg_health - latest.avg_health) / prev.avg_health) * 100

    if drop > 20:
        return {"alert": f"⚠️ Health dropped by {drop:.1f}%"}
    
    return {"alert": "✅ Stable"}