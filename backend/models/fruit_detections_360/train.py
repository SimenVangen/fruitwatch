from ultralytics import YOLO
import os
import argparse

def train_fruit_detector(data_config="fruit_data_360.yaml", epochs=50, model_size="n"):
    """
    Train YOLO model for fruit detection
    
    Args:
        data_config: Path to dataset YAML
        epochs: Number of training epochs
        model_size: Model size (n, s, m, l, x)
    """
    
    # Model selection
    model_map = {
        "n": "yolov8n.pt",
        "s": "yolov8s.pt", 
        "m": "yolov8m.pt",
        "l": "yolov8l.pt",
        "x": "yolov8x.pt"
    }
    
    model_name = model_map.get(model_size, "yolov8n.pt")
    
    print(f"🚀 Starting 360 Fruits detection training...")
    print(f"Model: {model_name}")
    print(f"Epochs: {epochs}")
    print(f"Data config: {data_config}")
    
    try:
        # Load model
        model = YOLO(model_name)
        
        # Train the model
        results = model.train(
            data=data_config,
            epochs=epochs,
            imgsz=640,
            batch=16,
            patience=10,
            save=True,
            exist_ok=True,
            device='cpu',  # Change to 'mps' for Apple Silicon or 'cuda' for GPU
            project="fruit_detection_360",  # Changed project name
            name=f"train_{model_size}",
            verbose=True
        )
        
        print("✅ Training completed successfully!")
        print(f"Model saved to: fruit_detection_360/train_{model_size}/")
        
        return results
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Train YOLO Fruit Detector on 360 Dataset")
    parser.add_argument("--data", default="fruit_360.yaml", help="Dataset config file")  # Updated default
    parser.add_argument("--epochs", type=int, default=50, help="Number of epochs")
    parser.add_argument("--model", default="n", choices=["n", "s", "m", "l", "x"], help="Model size")
    
    args = parser.parse_args()
    
    train_fruit_detector(
        data_config=args.data,
        epochs=args.epochs,
        model_size=args.model
    )

if __name__ == "__main__":
    main()