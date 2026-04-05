from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from PIL import Image
import io
from datetime import datetime
from typing import Optional
from jose import jwt, JWTError
import math
import random
import json
import uuid
from pathlib import Path


from app.db.db import get_db
from app.db.models import Detection, User, Farm, IndividualDetection
from app.core.config import SECRET_KEY, ALGORITHM
from app.services.harvest_predictor import HarvestPredictor
from models.multi_inference import predict_fruit_from_bytes

UPLOAD_DIR = Path("/Users/simen/Desktop/fruit_monitoring/backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(tags=["Detections"])

RIPE_LABEL = "lychee"
UNRIPE_LABEL = "lychee_2"

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise credentials_exception
    return user


@router.post("/process_drone_data")
async def process_drone_data(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    farm_id: int = Form(...),
    altitude: float = Form(50.0),
    timestamp: Optional[str] = Form(None),
    model_type: str = Form("lychee"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    img_bytes = await file.read()

    # Save original image
    filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
    save_path = UPLOAD_DIR / filename
    save_path.write_bytes(img_bytes)

    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")   

    # --- Run inference (only once) ---
    results = predict_fruit_from_bytes(image, model_type=model_type)
    print(f"🔍 Raw results: total={results.get('total_detected')}, detections={len(results.get('detections', []))}, model={results.get('model_used')}")

    # --- Draw bounding boxes and save annotated image ---
    from PIL import ImageDraw
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)
    for d in results.get("detections", []):
        bbox = d["bbox"]
        color = "red" if d.get("ripeness") == "ripe" else "green"
        draw.rectangle(bbox, outline=color, width=3)
        draw.text((bbox[0], bbox[1] - 10), f"{d['label']} {d['confidence']:.2f}", fill=color)
    annotated_filename = filename.replace(".jpg", "_annotated.jpg")
    annotated_path = UPLOAD_DIR / annotated_filename
    annotated.save(str(annotated_path))
    # --- Count ripe/unripe ---
    if model_type == "lychee":
        ripe_count = sum(1 for d in results['detections'] if d.get('ripeness') == 'ripe' or d.get('label') == 'lychee')
        unripe_count = sum(1 for d in results['detections'] if d.get('ripeness') == 'unripe' or d.get('label') == 'lychee_2')
    else:
        ripe_count = results.get('ripe_count', results.get('ripe', 0))
        unripe_count = results.get('unripe_count', results.get('unripe', 0))

    # --- Normalize results dict ---
    results['ripe'] = ripe_count
    results['unripe'] = unripe_count
    results['total_detected'] = results.get('total_detected', ripe_count + unripe_count)
    results['average_confidence'] = (
        sum(d['confidence'] for d in results['detections']) / len(results['detections'])
        if results['detections'] else 0
    )

    # --- Predict harvest timeline ---
    predictor = HarvestPredictor(db)
    results['harvest_prediction'] = predictor.predict_harvest_timeline(farm_id=farm_id)

    # --- Fetch farm ---
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # --- Parse timestamp ---
    try:
        detection_time = datetime.fromisoformat(timestamp) if timestamp else datetime.utcnow()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    # --- Save detection ---
    detection_entry = Detection(
        timestamp=detection_time,
        latitude=latitude,
        longitude=longitude,
        total_detected=results["total_detected"],
        ripe=results["ripe"],
        unripe=results["unripe"],
        predicted_next_week=json.dumps(results.get("harvest_prediction", {})),
        user_id=current_user.id,
        farm_id=farm.id,
        average_confidence=results.get("average_confidence", 0),
        image_path=str(save_path)   # 👈 add this line
    ) 

    db.add(detection_entry)
    db.flush()

    # --- Save individual detections ---
    individual_count = 0
    if results.get("detections"):
        positions = calculate_individual_positions(
            results["detections"], latitude, longitude, altitude, image.size
        )
        for detection, gps in zip(results["detections"], positions):
            db.add(IndividualDetection(
                detection_id=detection_entry.id,
                latitude=gps["lat"],
                longitude=gps["lon"],
                fruit_type=detection["label"],
                confidence=detection["confidence"],
                bbox=json.dumps(detection["bbox"])
            ))
            individual_count += 1

    db.commit()
    db.refresh(detection_entry)

    return {
        "timestamp": detection_time.isoformat(),
        "summary": {
            "total": results["total_detected"],
            "ripe": results["ripe"],
            "unripe": results["unripe"],
            "readiness_score": (
                (results["ripe"] / results["total_detected"]) * 100
                if results["total_detected"] > 0 else 0
            ),
            "harvest_prediction": results.get("harvest_prediction", {})
        },
        "individual_detections_count": individual_count,
        "detection_id": detection_entry.id
    }


def calculate_individual_positions(detections, drone_lat, drone_lon, altitude, image_size):
    positions = []
    width, height = image_size
    for d in detections:
        bbox = d["bbox"]
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2
        meters_per_pixel = (altitude * 0.9) / (height / 2)
        x_offset = (cx - width / 2) * meters_per_pixel
        y_offset = (cy - height / 2) * meters_per_pixel
        lat_offset = y_offset / 111320
        lon_offset = x_offset / (111320 * math.cos(math.radians(drone_lat)))
        positions.append({"lat": drone_lat + lat_offset, "lon": drone_lon + lon_offset})
    return positions


@router.get("/farm/{farm_id}")
def get_farm_detections(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    detections = db.query(Detection).filter(
        Detection.farm_id == farm_id,
        Detection.user_id == current_user.id
    ).order_by(Detection.timestamp.desc()).limit(50).all()

    return [
        {
            "id": d.id,
            "timestamp": d.timestamp.isoformat(),
            "latitude": d.latitude,
            "longitude": d.longitude,
            "total_detected": d.total_detected,
            "ripe": d.ripe,
            "unripe": d.unripe,
            "average_confidence": d.average_confidence,
            "model_type": "lychee"
        }
        for d in detections
    ]


@router.get("/3d-map/{farm_id}")
def get_3d_map_data(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        detections = db.query(IndividualDetection).join(Detection).filter(
            Detection.farm_id == farm_id,
            Detection.user_id == current_user.id
        ).all()
        return {
            "individual_fruits": [
                {
                    "id": d.id,
                    "position": [d.latitude, d.longitude, random.uniform(1.5, 3.0)],
                    "type": d.fruit_type,
                    "color": "red" if d.fruit_type == RIPE_LABEL else "green"
                }
                for d in detections
            ],
            "total": len(detections)
        }
    except Exception as e:
        print("3D MAP ERROR:", str(e))
        return {"error": "Failed to load map data"}