from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.db import get_db
from app.db.models import DroneMission

router = APIRouter(prefix="/missions", tags=["Missions"])


@router.get("/latest")
def get_latest_mission(db: Session = Depends(get_db)):
    mission = db.query(DroneMission).order_by(DroneMission.id.desc()).first()

    if not mission:
        raise HTTPException(status_code=404, detail="No missions found.")

    return {
        "id": mission.id,
        "start_time": mission.start_time,
        "end_time": mission.end_time,
        "status": mission.status
    }


@router.get("/all")
def get_all_missions(db: Session = Depends(get_db)):
    missions = db.query(DroneMission).order_by(DroneMission.start_time.desc()).all()

    return [
        {
            "id": m.id,
            "start_time": m.start_time,
            "end_time": m.end_time,
            "status": m.status
        }
        for m in missions
    ]