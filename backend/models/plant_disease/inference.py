# models/plant_disease/inference.py

import os
import numpy as np
from ultralytics import YOLO
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PLANT_MODEL_PATH = os.path.join(
    BASE_DIR, "plant_disease_results", "train_n", "weights", "best.pt"
)

print("🌿 plant_disease inference.py LOADED")


class PlantDiseaseDetector:
    def __init__(self, model_path=None):
        """Initialize YOLOv8 classification model for plant disease"""

        if model_path is None:
            model_path = PLANT_MODEL_PATH

        print(f"🔍 Loading model from : {model_path}")
        print(f"📁 File exists        : {os.path.exists(model_path)}")

        if not os.path.exists(model_path):
            print("❌ Model file not found — run train.py first")
            self.model = None
            self.class_names = []
            return

        try:
            self.model = YOLO(model_path)
            # Class names are saved inside the model after training
            self.class_names = list(self.model.names.values()) \
                if hasattr(self.model, "names") else []
            print(f"✅ Model loaded — {len(self.class_names)} classes")
        except Exception as e:
            print(f"❌ Model load error: {e}")
            self.model = None
            self.class_names = []

    def predict(self, image, confidence_threshold=0.25):
        """
        Run classification on a single leaf image.

        Args:
            image               : PIL Image or numpy array
            confidence_threshold: minimum confidence to report a result

        Returns dict with:
            status, plant, disease, is_healthy, confidence, all_predictions
        """

        if self.model is None:
            return {
                "status": "error",
                "message": "Model not loaded — run train.py first",
                "plant": None,
                "disease": None,
                "is_healthy": None,
                "confidence": 0.0,
                "all_predictions": [],
            }

        if isinstance(image, Image.Image):
            image = np.array(image)

        try:
            results = self.model(image, verbose=False)
        except Exception as e:
            return {
                "status": f"error during inference: {str(e)}",
                "plant": None,
                "disease": None,
                "is_healthy": None,
                "confidence": 0.0,
                "all_predictions": [],
            }

        if not results or results[0].probs is None:
            return {
                "status": "no result",
                "plant": None,
                "disease": None,
                "is_healthy": None,
                "confidence": 0.0,
                "all_predictions": [],
            }

        probs = results[0].probs
        top_idx = int(probs.top1)
        top_conf = float(probs.top1conf)
        top_label = self.class_names[top_idx] if top_idx < len(self.class_names) else "Unknown"

        # Parse label — format is "Plant_Disease" e.g. "Tomato_Early_Blight"
        parts = top_label.split("_", 1)
        plant = parts[0] if len(parts) >= 1 else top_label
        disease = parts[1] if len(parts) == 2 else "Unknown"
        is_healthy = "healthy" in disease.lower()

        # Build top-5 predictions
        top5_idx = probs.top5
        top5_conf = probs.top5conf.tolist()
        all_predictions = []
        for idx, conf in zip(top5_idx, top5_conf):
            label = self.class_names[idx] if idx < len(self.class_names) else "Unknown"
            all_predictions.append({"label": label, "confidence": round(float(conf), 4)})

        if top_conf < confidence_threshold:
            return {
                "status": "low_confidence",
                "plant": plant,
                "disease": disease,
                "is_healthy": is_healthy,
                "confidence": round(top_conf, 4),
                "all_predictions": all_predictions,
            }

        return {
            "status": "success",
            "plant": plant,
            "disease": disease,
            "is_healthy": is_healthy,
            "confidence": round(top_conf, 4),
            "all_predictions": all_predictions,
        }


# ── Singleton ──────────────────────────────────────────────────────────────────
_detector = None


def get_detector():
    global _detector
    if _detector is None:
        print("🚀 Initializing PlantDiseaseDetector...")
        _detector = PlantDiseaseDetector()
    return _detector


def predict_plant(image, confidence_threshold=0.25):
    """Main entry point — accepts PIL Image or numpy array"""
    return get_detector().predict(image, confidence_threshold)


def predict_plant_from_bytes(image_bytes, confidence_threshold=0.25):
    """Entry point for raw image bytes (e.g. from API upload)"""
    print("🌿 predict_plant_from_bytes CALLED")
    try:
        from io import BytesIO
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        return predict_plant(image, confidence_threshold)
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "status": f"error: {str(e)}",
            "plant": None,
            "disease": None,
            "is_healthy": None,
            "confidence": 0.0,
            "all_predictions": [],
        }


# ── Local test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🧪 Running local test...")
    test_image = Image.fromarray(
        np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    )
    result = predict_plant(test_image)
    print("📊 Result:", result)