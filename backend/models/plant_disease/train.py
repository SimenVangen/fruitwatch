from ultralytics import YOLO
import os
import argparse


def train_plant_disease(
    data_dir=os.path.expanduser("~/Desktop/plant_disease_data"),
    epochs=50,
    model_size="n"
):
    """
    Train YOLOv8 classification model for plant disease detection.

    Args:
        data_dir  : Path to prepared dataset (output of prepare_data.py)
        epochs    : Number of training epochs
        model_size: n / s / m / l / x
    """

    model_map = {
        "n": "yolov8n-cls.pt",
        "s": "yolov8s-cls.pt",
        "m": "yolov8m-cls.pt",
        "l": "yolov8l-cls.pt",
        "x": "yolov8x-cls.pt",
    }

    model_name = model_map.get(model_size, "yolov8n-cls.pt")
    data_dir = os.path.expanduser(data_dir)

    print(f"🚀 Starting plant disease classification training...")
    print(f"   Model   : {model_name}")
    print(f"   Epochs  : {epochs}")
    print(f"   Data    : {data_dir}")

    if not os.path.exists(data_dir):
        print(f"❌ Data directory not found: {data_dir}")
        print("   Run prepare_data.py first.")
        return None

    try:
        model = YOLO(model_name)

        results = model.train(
            data=data_dir,
            epochs=epochs,
            imgsz=224,
            batch=16,
            patience=10,
            save=True,
            exist_ok=True,
            device="cpu",        # Apple Silicon — change to 'cuda' for GPU, 'cpu' for CPU
            workers=0,           # fixes segfault on macOS MPS
            project="plant_disease_results",
            name=f"train_{model_size}",
            verbose=True,
        )

        print("✅ Training complete!")
        print(f"   Weights saved to: plant_disease_results/train_{model_size}/weights/best.pt")
        return results

    except Exception as e:
        print(f"❌ Training failed: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Train YOLOv8 plant disease classifier")
    parser.add_argument("--data",   default="~/Desktop/plant_disease_data", help="Prepared dataset path")
    parser.add_argument("--epochs", type=int, default=50,                   help="Number of epochs")
    parser.add_argument("--model",  default="n", choices=["n","s","m","l","x"], help="Model size")
    args = parser.parse_args()

    train_plant_disease(
        data_dir=args.data,
        epochs=args.epochs,
        model_size=args.model,
    )


if __name__ == "__main__":
    main()