# models/fruit_detections_360/inference.py

import os
import numpy as np
from ultralytics import YOLO
from PIL import Image
from io import BytesIO

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LYCHEE_MODEL_PATH = os.path.join(BASE_DIR, "fruit_detection_360", "train_n", "weights", "best.pt")

print("🔥 inference.py LOADED")
class FruitDetector:
    def __init__(self, model_path=None):
        """Initialize YOLO fruit detector"""

        if model_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))

            model_path = os.path.abspath(os.path.join(
                base_dir,
                "fruit_detection_360",
                "train_n",
                "weights",
                "best.pt"
            ))

        print(f"🔍 Trying to load model from: {model_path}")
        print(f"📁 File exists: {os.path.exists(model_path)}")

        if not os.path.exists(model_path):
            print("❌ MODEL FILE NOT FOUND")
            self.model = None
            return

        try:
            self.model = YOLO(model_path)
            print("✅ YOLO MODEL LOADED SUCCESSFULLY")
        except Exception as e:
            print(f"❌ MODEL LOAD ERROR: {e}")
            self.model = None

        self.class_names = [
            'Apple', 'Banana', 'Grape',
            'Orange', 'Pineapple', 'Watermelon'
        ]

    def predict(self, image, confidence_threshold=0.25):
        """Run inference on image"""

        if self.model is None:
            return {
                "status": "error",
                "message": "Model not available",
                "total_detected": 0,
                "ripe_count": 0,
                "unripe_count": 0,
                "detections": []
            }

        # Convert PIL → numpy
        if isinstance(image, Image.Image):
            image = np.array(image)

        try:
            results = self.model(image, conf=confidence_threshold, verbose=False)
        except Exception as e:
            return {
                "status": f"error during inference: {str(e)}",
                "total_detected": 0,
                "ripe_count": 0,
                "unripe_count": 0,
                "detections": []
            }

        detections = []
        total_detected = 0

        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            total_detected = len(boxes)

            for box in boxes:
                confidence = float(box.conf.item())
                class_id = int(box.cls.item())

                class_name = self.class_names[class_id] \
                    if class_id < len(self.class_names) else "Unknown"

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # 🔥 Simple ripeness logic
                is_ripe = confidence > 0.6

                detections.append({
                    "class": class_id,
                    "label": class_name,
                    "confidence": confidence,
                    "bbox": [x1, y1, x2, y2],
                    "is_ripe": is_ripe
                })

        ripe_count = sum(1 for d in detections if d["is_ripe"])
        unripe_count = total_detected - ripe_count

        return {
            "model_used": "fruit_detection_360",
            "status": "success",
            "total_detected": total_detected,
            "ripe_count": ripe_count,
            "unripe_count": unripe_count,
            "detections": detections
        }


# 🔁 Singleton (prevents reloading model every request)
_detector = None


def get_detector():
    global _detector
    if _detector is None:
        print("🚀 Initializing FruitDetector...")
        _detector = FruitDetector()
    return _detector


# 🧠 Main function (PIL / numpy)
def predict_fruit(image, confidence_threshold=0.25):
    detector = get_detector()
    return detector.predict(image, confidence_threshold)


def predict_fruit_from_bytes(image_bytes, confidence_threshold=0.25):
    global _detector
    print("🚀 predict_fruit_from_bytes CALLED")

    # Initialize detector if not already done
    if _detector is None:
        print("🔥 Initializing FruitDetector...")
        _detector = FruitDetector()
    else:
        print("🟢 Using existing FruitDetector instance")

    try:
        return _detector.predict(image_bytes, confidence_threshold)
    except Exception as e:
        print(f"❌ Error in prediction: {str(e)}")
        return {
            'model_used': 'unknown',
            'status': f'error: {str(e)}',
            'total_detected': 0,
            'detections': []
        }


# 🧪 Local test
if __name__ == "__main__":
    print("🧪 Running local test...")

    test_image = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
    test_image = Image.fromarray(test_image)

    result = predict_fruit(test_image)

    print("📊 Test result:")
    print(result)