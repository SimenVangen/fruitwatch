import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
import os
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MIXED_FRUITS_MODEL_PATH = os.path.join(BASE_DIR, "fruit_detection", "train_n", "weights", "best.pt")

class FruitDetector:
    def __init__(self, model_path=None):
        self.model = None
        self.model_loaded = False
        
        # Define classes FIRST
        self.ripe_classes = [0]      # 'lychee' - assuming this is ripe
        self.unripe_classes = [1]    # 'lychee_2' - assuming this is unripe
        self.fruit_names = {
            0: "lychee",      # Your first class
            1: "lychee_2"     # Your second class
        }
        
        # Try to load actual model, fallback to mock
        if model_path and os.path.exists(model_path):
            try:
                self.model = YOLO(model_path)
                self.model_loaded = True
                print("✅ Real YOLO model loaded successfully!")
                print(f"✅ Model path: {model_path}")

                # 🔍 DEBUG - NOW THIS WILL WORK
                print("🔍 MODEL CLASSES DEBUG:")
                print(f"   Model classes: {self.model.names}")
                print(f"   Number of classes: {len(self.model.names)}")
            
                # Check if our mapping matches the model
                for i, name in self.model.names.items():
                    print(f"   Class {i}: '{name}'")
                
                # Verify our ripe/unripe mapping
                print(f"   Our ripe classes: {self.ripe_classes}")
                print(f"   Our unripe classes: {self.unripe_classes}")

            except Exception as e:
                print(f"❌ Failed to load YOLO model: {e}")
                self.model_loaded = False
        else:
            print(f"🤖 Using mock detector (model path not found: {model_path})")
            self.model_loaded = False
        
    def predict(self, image):
        """
        Run fruit detection on image
        Returns: detection results with individual detections
        """
        print(f"🎯 Starting prediction - Model loaded: {self.model_loaded}")
        
        # Convert PIL to numpy if needed
        if isinstance(image, Image.Image):
            image_np = np.array(image)
            # Convert RGB to BGR for OpenCV
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            print(f"📐 Image size: {image.size}")
        else:
            image_np = image
            print(f"📐 Image size: {image_np.shape}")
        
        # Use real model if available
        if self.model_loaded and self.model is not None:
            print("🔍 Using REAL YOLO model for detection...")
            return self._predict_real(image_np)
        else:
            print("🎭 Using MOCK data for detection...")
            return self._predict_mock(image_np)
    
    def _predict_real(self, image_np):
        """Run actual YOLO detection with color-based ripeness"""
        try:
            print("🔄 Running YOLO inference...")
            # Run inference
            results = self.model(image_np)
            
            detections = []
            ripe_count = 0
            unripe_count = 0
            total_confidence = 0
            
            print(f"📊 YOLO returned {len(results)} result(s)")
            
            for i, r in enumerate(results):
                boxes = r.boxes
                if boxes is not None and len(boxes) > 0:
                    print(f"🎯 Found {len(boxes)} detection(s) in result {i}")
                    for j, box in enumerate(boxes):
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        bbox = box.xyxy[0].tolist()
                        
                        # 🎨 ADD COLOR-BASED RIPENESS ANALYSIS
                        ripeness = self._analyze_ripeness_by_color(image_np, bbox)
                        
                        detection = {
                            "class": cls,
                            "confidence": conf,
                            "bbox": bbox,
                            "label": self.fruit_names.get(cls, f"class_{cls}"),
                            "ripeness": ripeness  # Add ripeness from color analysis
                        }
                        detections.append(detection)
                        
                        # Count based on COLOR analysis, not class
                        if ripeness == "ripe":
                            ripe_count += 1
                        else:
                            unripe_count += 1
                        
                        total_confidence += conf
                        
                        if j < 3:  # Log first 3 detections
                            print(f"   🍎 Detection {j+1}: {detection['label']} -> {ripeness} (conf: {conf:.3f})")
                else:
                    print(f"❌ No boxes found in result {i}")
            
            total_fruits = len(detections)
            avg_confidence = total_confidence / total_fruits if total_fruits > 0 else 0
            
            print(f"✅ Real detection completed: {total_fruits} fruits found")
            print(f"📈 Ripe: {ripe_count}, Unripe: {unripe_count}")
            
            result = {
                "total_detected": total_fruits,
                "ripe": ripe_count,
                "unripe": unripe_count,
                "predicted_next_week": self._predict_growth(total_fruits),
                "detections": detections,  # ✅ INDIVIDUAL DETECTIONS
                "average_confidence": avg_confidence,
                "model_used": "real_yolo",
                "status": "success"
            }
            
            # Debug: Ensure detections are present
            if not result["detections"]:
                print("⚠️ WARNING: Real model returned empty detections array")
            else:
                print(f"✅ Individual detections: {len(result['detections'])}")
                
            return result
            
        except Exception as e:
            print(f"❌ Real model prediction failed: {e}")
            return self._predict_mock(image_np)
    
    def _analyze_ripeness_by_color(self, image_np, bbox):
        """Analyze fruit color to determine ripeness"""
        try:
            x1, y1, x2, y2 = [int(coord) for coord in bbox]
            
            # Ensure bbox is within image bounds
            h, w = image_np.shape[:2]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            
            if x2 <= x1 or y2 <= y1:
                return "unripe"
            
            # Extract fruit region
            fruit_region = image_np[y1:y2, x1:x2]
            
            if fruit_region.size == 0:
                return "unripe"
            
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(fruit_region, cv2.COLOR_BGR2HSV)
            
            # Color ranges for lychee ripeness
            # Ripe lychee: red/pink tones (Hue 0-10, 160-180)
            # Unripe lychee: green tones (Hue 35-85)
            
            # Create masks for ripe (red) and unripe (green)
            ripe_mask1 = cv2.inRange(hsv, (0, 50, 50), (10, 255, 255))      # Red low
            ripe_mask2 = cv2.inRange(hsv, (160, 50, 50), (180, 255, 255))   # Red high
            ripe_mask = cv2.bitwise_or(ripe_mask1, ripe_mask2)
            
            unripe_mask = cv2.inRange(hsv, (35, 50, 50), (85, 255, 255))    # Green
            
            ripe_pixels = cv2.countNonZero(ripe_mask)
            unripe_pixels = cv2.countNonZero(unripe_mask)
            total_pixels = fruit_region.shape[0] * fruit_region.shape[1]
            
            if total_pixels == 0:
                return "unripe"
            
            ripe_ratio = ripe_pixels / total_pixels
            unripe_ratio = unripe_pixels / total_pixels
            
            print(f"   🎨 Color analysis: {ripe_ratio:.2f} ripe, {unripe_ratio:.2f} unripe")
            
            # Determine ripeness based on dominant color
            if ripe_ratio > 0.2 and ripe_ratio > unripe_ratio:
                return "ripe"
            elif unripe_ratio > 0.2 and unripe_ratio > ripe_ratio:
                return "unripe"
            else:
                return "ripe"  # Default to ripe if ambiguous
                
        except Exception as e:
            print(f"❌ Color analysis failed: {e}")
            return "ripe"
    
    def _predict_mock(self, image_np):
        """Mock detection for lychee - WITH INDIVIDUAL DETECTIONS"""
        print("🎭 Generating mock detection data...")
        
        height, width = image_np.shape[:2]
        image_area = width * height
        
        print(f"📐 Image dimensions: {width}x{height}")
        
        # Lychee-specific logic - typically smaller, clustered fruits
        base_count = max(3, int(image_area / 80000))
        
        total = random.randint(base_count, base_count + 20)
        ripe = random.randint(int(total * 0.4), int(total * 0.7))
        unripe = total - ripe
        
        print(f"🎯 Mock: {total} total fruits ({ripe} ripe, {unripe} unripe)")
        
        # Generate lychee-specific detections WITH BOUNDING BOXES
        detections = []
        for i in range(total):
            is_ripe = i < ripe
            cls = 0 if is_ripe else 1  # 0=lychee, 1=lychee_2
            
            # Ensure bounding boxes are within image bounds
            bbox_width = random.randint(30, 80)
            bbox_height = random.randint(30, 80)
            x1 = random.randint(0, width - bbox_width - 1)
            y1 = random.randint(0, height - bbox_height - 1)
            x2 = x1 + bbox_width
            y2 = y1 + bbox_height
            
            detection = {
                "class": cls,
                "confidence": round(random.uniform(0.6, 0.95), 2),
                "bbox": [x1, y1, x2, y2],
                "label": self.fruit_names[cls],
                "ripeness": "ripe" if is_ripe else "unripe"
            }
            detections.append(detection)
        
        print(f"✅ Mock detections generated: {len(detections)} individual fruits")
        
        result = {
            "total_detected": total,
            "ripe": ripe,
            "unripe": unripe,
            "predicted_next_week": self._predict_growth(total),
            "detections": detections,  # ✅ INDIVIDUAL DETECTIONS
            "average_confidence": round(random.uniform(0.7, 0.9), 2),
            "model_used": "mock_data",
            "status": "mock_data_used",
            "message": "Using mock data - individual detections available for 3D map"
        }
        
        # Debug output
        if detections:
            sample = detections[0]
            print(f"📦 Sample detection: {sample['label']} with bbox {sample['bbox']}")
        
        return result
    
    def _predict_growth(self, current_count):
        """Predict fruit count for next week"""
        if current_count == 0:
            return random.randint(1, 10)
        
        # Simple growth prediction logic
        growth_factor = random.uniform(0.9, 1.4)  # 90% to 140% of current
        return max(0, int(current_count * growth_factor))

# Global detector instance
_detector = None

def load_model(model_path="/Users/simen/Desktop/fruit_monitoring/models/fruit_detections/fruit_detection/train_n/weights/best.pt"):
    """Load the model once (singleton pattern)"""
    global _detector
    if _detector is None:
        print(f"🔧 Loading model from: {model_path}")
        _detector = FruitDetector(model_path)
    else:
        print("♻️ Using cached detector instance")
    return _detector

def predict_fruit(image):
    """Main prediction function for external use"""
    print("🚀 Starting fruit prediction...")
    detector = load_model()
    results = detector.predict(image)
    
    # Final verification
    print("📋 FINAL RESULTS SUMMARY:")
    print(f"   Model used: {results['model_used']}")
    print(f"   Total fruits: {results['total_detected']}")
    print(f"   Individual detections: {len(results.get('detections', []))}")
    print(f"   Has detections key: {'detections' in results}")
    
    return results

# Enhanced test function
def test_detection():
    """Test the detector with detailed output"""
    print("🧪 STARTING DETECTION TEST")
    print("=" * 50)
    
    detector = load_model()
    
    # Create a test image
    test_image = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
    print(f"🎨 Created test image: {test_image.shape}")
    
    results = detector.predict(test_image)
    
    print("\n🎯 TEST RESULTS:")
    print(f"✅ Model used: {results['model_used']}")
    print(f"✅ Status: {results['status']}")
    print(f"📊 Total fruits: {results['total_detected']}")
    print(f"🍎 Ripe: {results['ripe']}")
    print(f"🍏 Unripe: {results['unripe']}")
    print(f"🔍 Individual detections: {len(results.get('detections', []))}")
    
    # Show sample detections
    if results.get('detections'):
        print(f"\n📦 SAMPLE DETECTIONS (first 3):")
        for i, det in enumerate(results['detections'][:3]):
            print(f"   {i+1}. {det['label']} -> {det.get('ripeness', 'unknown')} (conf: {det['confidence']:.3f}, bbox: {det['bbox']})")
    
    print("=" * 50)
    return results

# 🧪 REAL LYCHEE TEST FUNCTION
def test_with_real_lychee():
    """Test with actual lychee images"""
    print("🧪 TESTING WITH REAL LYCHEE IMAGES")
    print("=" * 50)
    
    detector = load_model()
    
       # UPDATE THESE PATHS TO YOUR ACTUAL TEST IMAGES:
    test_images = [
        "/Users/simen/Desktop/fruit_monitoring/models/fruit_detections/test_images/images.jpeg",
        "/Users/simen/Desktop/fruit_monitoring/models/fruit_detections/test_images/litchi-4284920_640-1.jpg",
        "//Users/simen/Desktop/fruit_monitoring/models/fruit_detections/test_images/lychee test.jpeg"
    ]
    
    for img_path in test_images:
        if os.path.exists(img_path):
            print(f"\n🖼️ Testing with: {os.path.basename(img_path)}")
            image = Image.open(img_path)
            results = detector.predict(image)
            
            print(f"🎯 Results: {results['ripe']} ripe, {results['unripe']} unripe")
            print(f"📊 Total detected: {results['total_detected']}")
            
            if results.get('detections'):
                print("🔍 First 3 detections:")
                for i, det in enumerate(results['detections'][:3]):
                    print(f"   {i+1}. {det['label']} -> {det.get('ripeness', 'unknown')} (conf: {det['confidence']:.3f})")
            else:
                print("❌ No detections found")
        else:
            print(f"❌ Image not found: {img_path}")

if __name__ == "__main__":
    test_detection()  # Test with random image first
    
    # Test with real lychee images
    test_with_real_lychee()