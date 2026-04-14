from pathlib import Path
from PIL import Image
import os
import sys

# ── Lychee model ──────────────────────────────────────────────
# NOTE: fruit_detections folder contains the lychee model (classes: lychee, lychee_2)
from .fruit_detections.fruit_detection import FruitDetector as LycheeModel, MIXED_FRUITS_MODEL_PATH as LYCHEE_PATH

# ── Plant disease model ───────────────────────────────────────
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
sys.path.append(ROOT_DIR)
from models.plant_disease.inference import PlantDiseaseDetector

PLANT_DISEASE_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "plant_disease",
    "plant_disease_results",
    "train_n",
    "weights",
    "best.pt"
)

# ── Initialize models once at startup ────────────────────────
lychee_model   = LycheeModel(Path(LYCHEE_PATH))
plant_detector = PlantDiseaseDetector(PLANT_DISEASE_MODEL_PATH)


def predict_from_image(image: Image.Image, farm_type: str = "lychee") -> dict:
    """
    Main entry point.
    - farm_type = "lychee"             → runs lychee model + plant disease
    - farm_type = "plant_disease_only" → runs plant disease only
    """
    print(f"🚀 predict_from_image — farm_type: {farm_type}")

    result = {
        "farm_type":     farm_type,
        "fruit":         None,
        "plant_disease": None,
    }

    # ── Lychee fruit detection ────────────────────────────────
    if farm_type == "lychee":
        try:
            fruit_result = lychee_model.predict(image)
            result["fruit"] = fruit_result
            print(f"🍈 Lychee: {fruit_result.get('total_detected', 0)} detected")
        except Exception as e:
            print(f"❌ Lychee error: {e}")
            result["fruit"] = {
                "status": "error", "total_detected": 0,
                "ripe_count": 0, "unripe_count": 0, "detections": []
            }

    # ── Plant disease always runs ─────────────────────────────
    try:
        disease_result = plant_detector.predict(image)
        result["plant_disease"] = disease_result
        print(f"🌿 Disease: {disease_result.get('status')} — {disease_result.get('disease')}")
    except Exception as e:
        print(f"❌ Disease error: {e}")
        result["plant_disease"] = {
            "status": "error", "plant": None,
            "disease": None, "is_healthy": None, "confidence": 0
        }

    return result


# ── Legacy function — kept for backwards compatibility ────────
def predict_fruit_from_bytes(image: Image.Image, model_type: str = "lychee") -> dict:
    print(f"🚀 predict_fruit_from_bytes CALLED with model: {model_type}")

    if model_type == "plant_disease":
        result = plant_detector.predict(image)
        return {
            "model_used":     "plant_disease",
            "status":         result.get("status"),
            "total_detected": 1 if result.get("status") == "success" else 0,
            "ripe_count":     0,
            "unripe_count":   0,
            "disease_type":   result.get("disease"),
            "plant_type":     result.get("plant"),
            "is_healthy":     result.get("is_healthy"),
            "confidence":     result.get("confidence", 0.0),
            "detections": [
                {
                    "label":      f"{result.get('plant')}_{result.get('disease')}",
                    "confidence": result.get("confidence", 0.0),
                    "bbox":       [0, 0, 0, 0],
                    "ripeness":   None,
                }
            ] if result.get("status") == "success" else [],
            "all_predictions": result.get("all_predictions", []),
        }

    # Legacy — only lychee model now
    return lychee_model.predict(image)