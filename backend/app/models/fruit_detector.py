import sys
import os
from pathlib import Path
from PIL import Image
import numpy as np

# Add models directory to Python path
models_root = Path(__file__).parent.parent.parent.parent / "models"
sys.path.append(str(models_root))

def run_inference(image):
    """
    Main inference function for the backend
    Connects to the actual fruit detection model
    """
    print("🚀 STARTING INFERENCE")
    print(f"📐 Input image type: {type(image)}")
    
    if isinstance(image, Image.Image):
        print(f"📊 Image dimensions: {image.size}")
    else:
        print(f"📊 Image shape: {image.shape if hasattr(image, 'shape') else 'unknown'}")
    
    try:
        # Import the actual fruit detection model
        from fruit_detections.inference import predict_fruit
        
        print("🎯 Using Fruit Detection Model...")
        results = predict_fruit(image)
        
        # ✅ CRITICAL: Ensure detections array exists
        if "detections" not in results:
            print("⚠️ WARNING: No 'detections' key in results, creating empty array")
            results["detections"] = []
        
        # Add image metadata
        if isinstance(image, Image.Image):
            results["image_metadata"] = {
                "width": image.width,
                "height": image.height,
                "mode": image.mode
            }
        
        print(f"✅ Detection completed: {results['total_detected']} fruits found")
        print(f"🔍 Individual detections: {len(results['detections'])}")
        print(f"🏷️ Model used: {results.get('model_used', 'unknown')}")
        
        # Debug: Show sample detections if available
        if results["detections"]:
            print("📦 SAMPLE DETECTIONS (first 3):")
            for i, det in enumerate(results["detections"][:3]):
                print(f"   {i+1}. {det.get('label', 'unknown')} " +
                      f"(conf: {det.get('confidence', 0):.3f}, " +
                      f"bbox: {det.get('bbox', 'no bbox')})")
        else:
            print("❌ No individual detections found - this will break 3D map!")
            
        return results
        
    except ImportError as e:
        print(f"❌ Could not import fruit detection model: {e}")
        print("🔄 Falling back to mock data...")
        return get_fallback_results(image)
    except Exception as e:
        print(f"❌ Detection error: {e}")
        print("🔄 Falling back to mock data...")
        return get_fallback_results(image)

def get_fallback_results(image):
    """
    Fallback when model is not available - WITH INDIVIDUAL DETECTIONS FOR 3D MAP
    """
    import random
    
    print("🎭 Generating fallback data with individual detections...")
    
    if isinstance(image, Image.Image):
        width, height = image.size
        base_count = max(3, (width * height) // 40000)
        print(f"📐 Using image dimensions: {width}x{height}")
    else:
        base_count = 10
        width, height = 640, 480  # Default dimensions
        print(f"📐 Using default dimensions: {width}x{height}")
        
    total = random.randint(base_count, base_count + 20)
    ripe = random.randint(int(total * 0.3), int(total * 0.8))
    unripe = total - ripe

    print(f"🎯 Fallback: {total} total fruits ({ripe} ripe, {unripe} unripe)")

    # ✅ CRITICAL: Create individual detections with bounding boxes for 3D map
    detections = []
    for i in range(total):
        is_ripe = i < ripe
        cls = 0 if is_ripe else 1
        
        # Create realistic bounding boxes within image bounds
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
            "label": "lychee" if cls == 0 else "lychee_2"
        }
        detections.append(detection)

    print(f"✅ Generated {len(detections)} individual detections with bounding boxes")
    
    # Show sample of what was created
    if detections:
        sample = detections[0]
        print(f"📦 Sample detection: {sample['label']} with bbox {sample['bbox']}")

    result = {
        "total_detected": total,
        "ripe": ripe,
        "unripe": unripe,
        "predicted_next_week": total + random.randint(-3, 8),
        "detections": detections,  # ✅ THIS IS ESSENTIAL FOR 3D MAP!
        "average_confidence": round(random.uniform(0.7, 0.9), 2),
        "model_used": "fallback",
        "status": "model_unavailable",
        "message": "Real model not available - using fallback with individual detections"
    }
    
    print("✅ Fallback data ready with individual detections for 3D map")
    return result

def test_inference_detailed():
    """Enhanced test function with detailed output"""
    print("\n" + "="*60)
    print("🧪 ENHANCED INFERENCE TEST")
    print("="*60)
    
    # Test with different image types
    test_image = Image.new('RGB', (640, 480), color='green')
    print(f"🎨 Test image: {test_image.size}")
    
    results = run_inference(test_image)
    
    print("\n📋 TEST RESULTS SUMMARY:")
    print(f"   ✅ Model used: {results.get('model_used', 'unknown')}")
    print(f"   ✅ Status: {results.get('status', 'unknown')}")
    print(f"   📊 Total fruits: {results.get('total_detected', 0)}")
    print(f"   🍎 Ripe: {results.get('ripe', 0)}")
    print(f"   🍏 Unripe: {results.get('unripe', 0)}")
    print(f"   🔍 Individual detections: {len(results.get('detections', []))}")
    print(f"   📦 Has detections key: {'detections' in results}")
    
    if results.get('detections'):
        print(f"\n🎯 DETECTION VERIFICATION (first 2):")
        for i, det in enumerate(results['detections'][:2]):
            print(f"   {i+1}. {det.get('label', 'unknown')} " +
                  f"(confidence: {det.get('confidence', 0):.3f})")
            print(f"      Bounding box: {det.get('bbox', 'MISSING')}")
    else:
        print("❌ CRITICAL: No individual detections - 3D map will not work!")
    
    print("="*60)
    return results

# Test function
if __name__ == "__main__":
    test_inference_detailed()# Test the inference directly
