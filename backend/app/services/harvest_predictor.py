# backend/app/services/harvest_predictor.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import random

class HarvestPredictor:
    def __init__(self, db: Session):
        self.db = db
    
    def predict_harvest_timeline(self, farm_id: int) -> Dict[str, Any]:
        """Predict harvest timeline using the latest detections for the farm"""
        from app.db.models import Detection

        # Fetch latest detection(s) for the farm
        detections = self.db.query(Detection).filter(
            Detection.farm_id == farm_id
        ).order_by(Detection.timestamp.desc()).limit(10).all()  # last 10 detections

        if not detections:
            return self._get_default_prediction()

        aggregated_data = self._aggregate_detections(detections)

        ripe_percentage = aggregated_data["ripe_percentage"]
        total_detected = aggregated_data["total_detected"]

        # Decide timeline based on ripeness
        if ripe_percentage >= 80:
            timeline = self._get_imminent_harvest_timeline(ripe_percentage, aggregated_data)
        elif ripe_percentage >= 50:
            timeline = self._get_medium_term_timeline(ripe_percentage, aggregated_data)
        else:
            timeline = self._get_long_term_timeline(ripe_percentage, aggregated_data)

        # Add extra info
        timeline.update({
            "current_ripeness": {
                "ripe_percentage": round(ripe_percentage, 1),
                "ripe_count": aggregated_data["total_ripe"],
                "unripe_count": aggregated_data["total_unripe"],
                "total_fruits": total_detected,
                "average_confidence": round(aggregated_data["average_confidence"], 3)
            },
            "prediction_confidence": self._calculate_confidence(aggregated_data),
            "visual_indicators": self._get_visual_indicators(ripe_percentage),
            "analysis_metadata": {
                "last_analysis_time": aggregated_data["latest_timestamp"].isoformat(),
                "total_images": aggregated_data["detection_count"]
            }
        })

        return timeline

    def _aggregate_detections(self, detections: List) -> Dict[str, Any]:
        """Aggregate multiple detections"""
        total_ripe = sum(d.ripe for d in detections if d.ripe is not None)
        total_unripe = sum(d.unripe for d in detections if d.unripe is not None)
        total_detected = sum(d.total_detected for d in detections if d.total_detected is not None)

        confidences = [d.average_confidence for d in detections if d.average_confidence is not None]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        timestamps = [d.timestamp for d in detections if d.timestamp]
        latest_timestamp = max(timestamps) if timestamps else datetime.utcnow()

        ripe_percentage = (total_ripe / total_detected * 100) if total_detected > 0 else 0

        return {
            "total_ripe": total_ripe,
            "total_unripe": total_unripe,
            "total_detected": total_detected,
            "ripe_percentage": ripe_percentage,
            "average_confidence": avg_confidence,
            "detection_count": len(detections),
            "latest_timestamp": latest_timestamp
        }

    # --- Timeline methods ---
    def _get_imminent_harvest_timeline(self, ripe_percentage, data):
        days_to_harvest = max(1, int((100 - ripe_percentage) / 10))
        return {
            "harvest_stage": "IMMINENT",
            "stage_color": "#EF4444",
            "stage_icon": "🚨",
            "optimal_harvest_date": (datetime.now() + timedelta(days=days_to_harvest)).strftime("%Y-%m-%d"),
            "days_until_harvest": days_to_harvest,
            "urgency_level": "HIGH",
            "recommendations": [
                f"Harvest within {days_to_harvest} days",
                f"Based on {data['total_detected']} fruits analyzed",
            ],
            "risks": [
                f"High risk of over-ripening ({ripe_percentage:.1f}% ripe)"
            ]
        }

    def _get_medium_term_timeline(self, ripe_percentage, data):
        days_to_harvest = int((80 - ripe_percentage) / 5) + 3
        return {
            "harvest_stage": "APPROACHING",
            "stage_color": "#F59E0B",
            "stage_icon": "📅",
            "optimal_harvest_date": (datetime.now() + timedelta(days=days_to_harvest)).strftime("%Y-%m-%d"),
            "days_until_harvest": days_to_harvest,
            "urgency_level": "MEDIUM",
            "recommendations": [f"Harvest in {days_to_harvest} days"],
            "risks": ["Watch for uneven ripening"]
        }

    def _get_long_term_timeline(self, ripe_percentage, data):
        days_to_harvest = int((50 - ripe_percentage) / 3) + 10
        return {
            "harvest_stage": "DEVELOPING",
            "stage_color": "#10B981",
            "stage_icon": "🌱",
            "optimal_harvest_date": (datetime.now() + timedelta(days=days_to_harvest)).strftime("%Y-%m-%d"),
            "days_until_harvest": days_to_harvest,
            "urgency_level": "LOW",
            "recommendations": [f"Expected harvest in {days_to_harvest} days"],
            "risks": ["Regular monitoring required"]
        }

    def _calculate_confidence(self, data):
        confidence = 0.7
        if data["detection_count"] >= 10:
            confidence += 0.05
        if data["total_detected"] > 50:
            confidence += 0.05
        if data["average_confidence"] > 0.7:
            confidence += 0.05
        return min(round(confidence, 2), 0.95)

    def _get_visual_indicators(self, ripe_percentage):
        if ripe_percentage >= 80:
            color = "#EF4444"
            label = "Ready to Harvest"
            emoji = "🍎"
        elif ripe_percentage >= 50:
            color = "#F59E0B"
            label = "Ripening"
            emoji = "🍏"
        else:
            color = "#10B981"
            label = "Developing"
            emoji = "🌿"
        return {
            "progress_percentage": ripe_percentage,
            "progress_color": color,
            "progress_label": label,
            "progress_emoji": emoji
        }

    def _get_default_prediction(self):
        return {
            "harvest_stage": "UNKNOWN",
            "stage_color": "#6B7280",
            "stage_icon": "❓",
            "optimal_harvest_date": "Collect more data",
            "days_until_harvest": None,
            "urgency_level": "UNKNOWN",
            "recommendations": ["Collect drone imagery for analysis"],
            "risks": ["Insufficient data for accurate prediction"],
            "current_ripeness": {
                "ripe_percentage": 0,
                "ripe_count": 0,
                "unripe_count": 0,
                "total_fruits": 0,
                "average_confidence": 0
            },
            "prediction_confidence": 0.0,
            "visual_indicators": {
                "progress_percentage": 0,
                "progress_color": "#6B7280",
                "progress_label": "No Data",
                "progress_emoji": "📊"
            }
        }