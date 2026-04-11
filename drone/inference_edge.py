from picamera2 import Picamera2
from ultralytics import YOLO
import cv2

print("Loading models...")
models = {
    "lychee": YOLO("/home/pi/best.pt"),
    "multi": YOLO("/home/pi/best_multi.pt")
}
current_model = "lychee"
print("Both models loaded!")

picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration(
    main={"format": "RGB888", "size": (640, 640)}
))
picam2.start()

while True:
    frame = picam2.capture_array()
    results = models[current_model](frame, conf=0.4, verbose=False)
    annotated = results[0].plot()
    total = len(results[0].boxes) if results[0].boxes is not None else 0
    cv2.putText(annotated, f"FruitWatch | {total} fruits | model: {current_model}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.imshow("FruitWatch", annotated)
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('l'):
        current_model = "lychee"
    elif key == ord('m'):
        current_model = "multi"

picam2.stop()
cv2.destroyAllWindows()
