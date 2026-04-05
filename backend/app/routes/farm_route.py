from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.db import get_db
from app.db.models import Farm, Field, User
from app.schemas import FarmSchema
from app.core.dependencies import get_current_user  # ✅ centralized auth

router = APIRouter(tags=["Farms"])


@router.post("/", response_model=dict)
def create_farm(
    farm: FarmSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not farm.name:
        raise HTTPException(status_code=400, detail="Farm name required")

    new_farm = Farm(
        name=farm.name,
        location=farm.location,
        owner_id=current_user.id
    )

    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)

    for f in farm.fields or []:
        coords = f.coordinates
        if hasattr(coords, "dict"):
            coords = coords.dict()

        db.add(Field(
            name=f.name,
            coordinates=json.dumps(coords),
            farm_id=new_farm.id
        ))

    db.commit()

    return {
        "id": new_farm.id,
        "name": new_farm.name,
        "location": new_farm.location
    }


@router.get("/", response_model=List[dict])
def get_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()

    result = []
    for farm in farms:
        farm_dict = {
            "id": farm.id,
            "name": farm.name,
            "location": farm.location,
            "fields": []
        }

        for f in farm.fields:
            try:
                coords = json.loads(f.coordinates) if isinstance(f.coordinates, str) else f.coordinates
                coords = coords if isinstance(coords, dict) else {"x": 0, "y": 0}
            except:
                coords = {"x": 0, "y": 0}

            farm_dict["fields"].append({
                "name": f.name,
                "coordinates": {
                    "x": coords.get("x", 0),
                    "y": coords.get("y", 0)
                }
            })

        result.append(farm_dict)

    return result