# backend/app/routes/summary_route.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.db import get_db
from app.db.models import Farm, Detection, User
from app.core.dependencies import get_current_user

import requests
from datetime import datetime, timedelta
import os
import logging
import random
from dotenv import load_dotenv

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Load environment variables
load_dotenv()

router = APIRouter(tags=["Summary"])
logger = logging.getLogger(__name__)

# Load API key safely
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
if not OPENWEATHER_API_KEY:
    logger.warning("⚠️ OpenWeather API key missing. Weather data disabled.")

# Simple in-memory cache
weather_cache = {}


# -------------------------------
# Pydantic Models
# -------------------------------
class PredictionHistory(BaseModel):
    date: str
    ripe: int
    unripe: int
    predicted_next_week: Optional[int] = None

def _safe_int(value) -> int:
    """Safely convert a value to int, returning 0 if it's not numeric (e.g. JSON strings)."""
    if value is None:
        return 0
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return 0


class FarmSummary(BaseModel):
    id: int
    name: str
    total_detections: int
    total_ripe: int
    total_unripe: int
    harvested_pct: float
    last_update: Optional[str]
    prediction_history: List[PredictionHistory]
    current_weather: Dict[str, Any]
    weather_history: List[Dict[str, Any]]
    weather_forecast: List[Dict[str, Any]]


# -------------------------------
# Helpers
# -------------------------------
def is_valid_coordinates(lat: float, lon: float) -> bool:
    return lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180


def fetch_weather(lat: float, lon: float):
    if not OPENWEATHER_API_KEY or not is_valid_coordinates(lat, lon):
        return {"error": "Weather unavailable"}

    cache_key = f"{lat:.2f}_{lon:.2f}"

    # Cache (5 min)
    if cache_key in weather_cache:
        cached_time, cached_data = weather_cache[cache_key]
        if datetime.now() - cached_time < timedelta(minutes=5):
            return cached_data

    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()

        result = {
            "temperature": data.get("main", {}).get("temp"),
            "humidity": data.get("main", {}).get("humidity"),
            "weather": data.get("weather", [{}])[0].get("description"),
            "wind_speed": data.get("wind", {}).get("speed"),
        }

        weather_cache[cache_key] = (datetime.now(), result)
        return result

    except Exception as e:
        logger.warning(f"Weather fetch failed: {e}")
        return {"error": "Weather unavailable"}


def fetch_weather_forecast(lat: float, lon: float):
    if not OPENWEATHER_API_KEY or not is_valid_coordinates(lat, lon):
        return []

    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/forecast"
            f"?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        )
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()

        forecast = []
        for item in data.get("list", [])[:5]:
            forecast.append({
                "date": item.get("dt_txt"),
                "temp": item.get("main", {}).get("temp"),
                "weather": item.get("weather", [{}])[0].get("description"),
            })

        return forecast

    except Exception as e:
        logger.warning(f"Forecast fetch failed: {e}")
        return []


def fetch_weather_history():
    # Mock data (since real history API is paid)
    history = []
    for i in range(7):
        history.append({
            "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
            "temperature": round(20 + random.uniform(-5, 5), 1),
            "humidity": random.randint(60, 90),
        })
    return history[::-1]


# -------------------------------
# MAIN ROUTE
# -------------------------------
@router.get("/", response_model=List[FarmSummary], summary="Get farm dashboard summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()

    summary_list = []

    for farm in farms:
        detections = (
            db.query(Detection)
            .filter(
                Detection.farm_id == farm.id,
                Detection.user_id == current_user.id
            )
            .order_by(Detection.timestamp.asc())
            .all()
        )

        total_detections = len(detections)
        total_ripe = sum(d.ripe or 0 for d in detections)
        total_unripe = sum(d.unripe or 0 for d in detections)

        last_update = max([d.timestamp for d in detections], default=None)

        harvested_pct = (
            round((total_ripe / (total_ripe + total_unripe)) * 100, 2)
            if (total_ripe + total_unripe) > 0 else 0
        )

        prediction_history = [
            {
                "date": d.timestamp.isoformat(),
                "ripe": d.ripe or 0,
                "unripe": d.unripe or 0,
                "predicted_next_week": _safe_int(d.predicted_next_week),
            }
            for d in detections[-10:]
        ]

        # Weather
        latest = detections[-1] if detections else None

        current_weather = {}
        weather_forecast = []
        weather_history = fetch_weather_history()

        if latest and latest.latitude and latest.longitude:
            current_weather = fetch_weather(latest.latitude, latest.longitude)
            weather_forecast = fetch_weather_forecast(latest.latitude, latest.longitude)

        summary_list.append({
            "id": farm.id,
            "name": farm.name,
            "total_detections": total_detections,
            "total_ripe": total_ripe,
            "total_unripe": total_unripe,
            "harvested_pct": harvested_pct,
            "last_update": last_update.isoformat() if last_update else None,
            "prediction_history": prediction_history,
            "current_weather": current_weather,
            "weather_history": weather_history,
            "weather_forecast": weather_forecast,
        })

    logger.debug(f"Generated summary for {len(summary_list)} farms")

    return summary_list