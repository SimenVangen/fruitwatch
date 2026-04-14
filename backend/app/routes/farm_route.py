from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.db import get_db
from app.db.models import Farm, Field, User
from app.schemas import FarmSchema
from app.core.dependencies import get_current_user

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
        owner_id=current_user.id,
        farm_type=farm.farm_type or "lychee",
        run_disease_detection=farm.run_disease_detection if farm.run_disease_detection is not None else True,
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
        "id":                    new_farm.id,
        "name":                  new_farm.name,
        "location":              new_farm.location,
        "farm_type":             new_farm.farm_type,
        "run_disease_detection": new_farm.run_disease_detection,
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
            "id":                    farm.id,
            "name":                  farm.name,
            "location":              farm.location,
            "farm_type":             farm.farm_type or "lychee",
            "run_disease_detection": farm.run_disease_detection if farm.run_disease_detection is not None else True,
            "fields":                []
        }

        for f in farm.fields:
            try:
                coords = json.loads(f.coordinates) if isinstance(f.coordinates, str) else f.coordinates
                coords = coords if isinstance(coords, dict) else {"x": 0, "y": 0}
            except Exception:
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


@router.patch("/{farm_id}", response_model=dict)
def update_farm(
    farm_id: int,
    farm: FarmSchema = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update farm settings including farm_type and disease detection toggle."""
    existing = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == current_user.id
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Farm not found")

    if farm.name:
        existing.name = farm.name
    if farm.location:
        existing.location = farm.location
    if farm.farm_type:
        existing.farm_type = farm.farm_type
    if farm.run_disease_detection is not None:
        existing.run_disease_detection = farm.run_disease_detection

    db.commit()
    db.refresh(existing)

    return {
        "id":                    existing.id,
        "name":                  existing.name,
        "location":              existing.location,
        "farm_type":             existing.farm_type,
        "run_disease_detection": existing.run_disease_detection,
    }