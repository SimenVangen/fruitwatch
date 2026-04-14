from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from PIL import Image, ImageDraw
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
from models.multi_inference import predict_from_image

# ── Upload directory helpers ──────────────────────────────────
BASE_UPLOAD_DIR = Path("/Users/simen/Desktop/fruit_monitoring/backend/uploads")

FOLDER_MAP = {
    "lychee":             "lychee",
    "plant_disease_only": "plant_disease",
}

# Minimum confidence to trust a disease result
DISEASE_CONFIDENCE_THRESHOLD = 0.6

def get_upload_dir(farm_type: str) -> Path:
    folder = FOLDER_MAP.get(farm_type, "lychee")
    path = BASE_UPLOAD_DIR / folder / "originals"
    path.mkdir(parents=True, exist_ok=True)
    return path

def get_annotated_dir(farm_type: str) -> Path:
    folder = FOLDER_MAP.get(farm_type, "lychee")
    path = BASE_UPLOAD_DIR / folder / "annotated"
    path.mkdir(parents=True, exist_ok=True)
    return path

def image_url_path(full_path: str) -> str:
    if not full_path:
        return None
    p = Path(full_path)
    parts = p.parts
    try:
        idx = next(i for i, part in enumerate(parts) if part == "uploads")
        return "/" + "/".join(parts[idx:])
    except StopIteration:
        return f"/uploads/{p.name}"

# ─────────────────────────────────────────────────────────────
router = APIRouter(tags=["Detections"])

RIPE_LABEL   = "lychee"
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # --- Validate image ---
    img_bytes = await file.read()
    try:
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file — please upload a valid JPG or PNG")

    # --- Fetch farm ---
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    farm_type = farm.farm_type or "lychee"

    # --- Save original image ---
    filename  = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
    save_path = get_upload_dir(farm_type) / filename
    save_path.write_bytes(img_bytes)

    # --- Run both models automatically ---
    combined        = predict_from_image(image, farm_type=farm_type)
    fruit_results   = combined.get("fruit") or {}
    disease_results = combined.get("plant_disease") or {}

    # --- Disease confidence threshold + farm toggle ---
    run_disease = farm.run_disease_detection
    if isinstance(run_disease, str):
        run_disease = run_disease.lower() != "false"
    run_disease = run_disease if run_disease is not None else True

    disease_confidence = disease_results.get("confidence", 0)
    disease_trusted    = (
        run_disease
        and disease_results.get("status") == "success"
        and disease_confidence >= DISEASE_CONFIDENCE_THRESHOLD
    )

    if not run_disease:
        print(f"🌿 Disease detection disabled for this farm")
        disease_type = plant_type = is_healthy = None
    elif disease_trusted:
        disease_type = disease_results.get("disease")
        plant_type   = disease_results.get("plant")
        is_healthy   = disease_results.get("is_healthy")
        print(f"🌿 Disease trusted: {plant_type} — {disease_type} ({int(disease_confidence * 100)}%)")
    else:
        disease_type = plant_type = is_healthy = None
        print(f"🌿 Disease ignored: confidence too low ({int(disease_confidence * 100)}% < {int(DISEASE_CONFIDENCE_THRESHOLD * 100)}%)")

    print(f"🔍 Farm type: {farm_type}")
    print(f"🍈 Fruit: {fruit_results.get('total_detected', 0)} detected")

    # --- Draw annotations ---
    annotated    = image.copy()
    draw         = ImageDraw.Draw(annotated)
    img_w, img_h = annotated.size

    # Lychee bounding boxes
    if fruit_results.get("detections"):
        for d in fruit_results["detections"]:
            bbox = d.get("bbox", [0, 0, 0, 0])
            if bbox and bbox[2] > 0:
                color = "red" if d.get("ripeness") == "ripe" else "green"
                draw.rectangle(bbox, outline=color, width=3)
                draw.text(
                    (bbox[0], max(0, bbox[1] - 14)),
                    f"{d['label']} {d['confidence']:.2f}",
                    fill=color,
                )

    # Disease overlay banner
    if disease_trusted:
        _is_healthy  = is_healthy is True or str(is_healthy).lower() == "true"
        border_color = (16, 185, 129) if _is_healthy else (239, 68, 68)
        bg_color     = (16, 185, 129, 200) if _is_healthy else (239, 68, 68, 200)
        status_text  = "Healthy" if _is_healthy else (disease_type or "Unknown").replace("_", " ")
        label        = f"{status_text}  |  {plant_type or 'Plant'}  |  {int(disease_confidence * 100)}%"

        draw.rectangle([(0, 0), (img_w - 1, img_h - 1)], outline=border_color, width=6)
        banner_h = max(36, img_h // 10)
        banner_y = img_h - banner_h
        draw.rectangle([(0, banner_y), (img_w, img_h)], fill=bg_color)
        try:
            bb     = draw.textbbox((0, 0), label)
            text_w = bb[2] - bb[0]
            text_h = bb[3] - bb[1]
            draw.text(
                ((img_w - text_w) // 2, banner_y + (banner_h - text_h) // 2),
                label, fill=(255, 255, 255)
            )
        except Exception:
            draw.text((10, banner_y + 8), label, fill=(255, 255, 255))

    annotated_filename = filename.replace(".jpg", "_annotated.jpg")
    annotated_path     = get_annotated_dir(farm_type) / annotated_filename
    annotated.save(str(annotated_path))

    # --- Count ripe/unripe (lychee only) ---
    detections_list = fruit_results.get("detections", [])
    ripe_count   = sum(1 for d in detections_list if d.get("ripeness") == "ripe"   or d.get("label") == "lychee")
    unripe_count = sum(1 for d in detections_list if d.get("ripeness") == "unripe" or d.get("label") == "lychee_2")
    total_detected     = fruit_results.get("total_detected", ripe_count + unripe_count)
    average_confidence = (
        sum(d["confidence"] for d in detections_list) / len(detections_list)
        if detections_list else 0
    )

    # --- Harvest prediction ---
    predictor          = HarvestPredictor(db)
    harvest_prediction = predictor.predict_harvest_timeline(farm_id=farm_id)

    # --- Parse timestamp ---
    try:
        detection_time = datetime.fromisoformat(timestamp) if timestamp else datetime.utcnow()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    # --- Save to DB ---
    detection_entry = Detection(
        timestamp=detection_time,
        latitude=latitude,
        longitude=longitude,
        total_detected=total_detected,
        ripe=ripe_count,
        unripe=unripe_count,
        predicted_next_week=json.dumps(harvest_prediction or {}),
        user_id=current_user.id,
        farm_id=farm.id,
        average_confidence=average_confidence,
        image_path=str(save_path),
        model_type=farm_type,
        disease_type=disease_type,
        plant_type=plant_type,
        is_healthy=str(is_healthy) if is_healthy is not None else None,
    )

    db.add(detection_entry)
    db.flush()

    # --- Individual lychee detections ---
    individual_count = 0
    if detections_list and farm_type == "lychee":
        positions = calculate_individual_positions(
            detections_list, latitude, longitude, altitude, image.size
        )
        for detection, gps in zip(detections_list, positions):
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
        "farm_type": farm_type,
        "image_url": image_url_path(str(save_path)),
        "summary": {
            "total":              total_detected,
            "ripe":               ripe_count,
            "unripe":             unripe_count,
            "readiness_score":    (ripe_count / total_detected * 100) if total_detected > 0 else 0,
            "harvest_prediction": harvest_prediction or {},
            "disease_type":       disease_type,
            "plant_type":         plant_type,
            "is_healthy":         is_healthy,
            "disease_confidence": disease_confidence if disease_trusted else None,
            "disease_trusted":    disease_trusted,
            "all_predictions":    disease_results.get("all_predictions", []),
        },
        "individual_detections_count": individual_count,
        "detection_id": detection_entry.id,
    }


def calculate_individual_positions(detections, drone_lat, drone_lon, altitude, image_size):
    positions = []
    width, height = image_size
    for d in detections:
        bbox = d["bbox"]
        cx   = (bbox[0] + bbox[2]) / 2
        cy   = (bbox[1] + bbox[3]) / 2
        meters_per_pixel = (altitude * 0.9) / (height / 2)
        x_offset   = (cx - width  / 2) * meters_per_pixel
        y_offset   = (cy - height / 2) * meters_per_pixel
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
            "id":                 d.id,
            "timestamp":          d.timestamp.isoformat(),
            "latitude":           d.latitude,
            "longitude":          d.longitude,
            "total_detected":     d.total_detected,
            "ripe":               d.ripe,
            "unripe":             d.unripe,
            "average_confidence": d.average_confidence,
            "model_type":         d.model_type or "lychee",
            "disease_type":       d.disease_type,
            "plant_type":         d.plant_type,
            "is_healthy":         d.is_healthy,
            "image_path":         image_url_path(d.image_path),
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
                    "id":       d.id,
                    "position": [d.latitude, d.longitude, random.uniform(1.5, 3.0)],
                    "type":     d.fruit_type,
                    "color":    "red" if d.fruit_type == RIPE_LABEL else "green"
                }
                for d in detections
            ],
            "total": len(detections)
        }
    except Exception as e:
        print("3D MAP ERROR:", str(e))
        return {"error": "Failed to load map data"}