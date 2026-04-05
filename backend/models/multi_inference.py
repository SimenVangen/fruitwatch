from pathlib import Path
from PIL import Image

# Import the existing inference modules
from .fruit_detections_360.fruit_detection_360 import FruitDetector as LycheeDetector, LYCHEE_MODEL_PATH
from .fruit_detections.fruit_detection import FruitDetector as MixedDetector, MIXED_FRUITS_MODEL_PATH



# Initialize models
lychee_detector = LycheeDetector(Path(LYCHEE_MODEL_PATH))
mixed_detector = MixedDetector(Path(MIXED_FRUITS_MODEL_PATH))

def predict_fruit_from_bytes(image: Image.Image, model_type="lychee"):
    detector = mixed_detector if model_type == "lychee" else lychee_detector
    print(f"🚀 predict_fruit_from_bytes CALLED with model: {model_type}")
    return detector.predict(image)