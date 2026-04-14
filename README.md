# 🌾 FruitWatch — AI-Powered Fruit Monitoring Platform

> Drone-based fruit detection, ripeness analysis, plant disease detection, and harvest prediction. Built with YOLOv8, FastAPI, and React.

---

## The Idea

It started with a simple frustration: fruit picking is hard, dangerous, and inefficient — especially on mountain terrain where workers risk injury every season.

My original plan was ambitious. I wanted to build a **soft robotic hand** that could autonomously pick lychee fruits from trees. I read research papers, studied actuator designs, looked into pneumatic grippers and compliant mechanisms. It was genuinely fascinating work.

Then reality hit. I didn't have the hardware. I didn't have the manufacturing capability. And honestly, I didn't have the mechanical engineering background to make it work at any meaningful level. The papers I was reading were from PhD labs with years of funding and specialized equipment.

So I scaled down — but not in ambition.

Instead of a hand that picks fruit, I built a **brain that monitors it**. A full-stack AI platform that lets a drone fly over an orchard, detect and classify fruits, detect plant diseases, map GPS coordinates, predict harvest readiness, and display everything in a real-time dashboard.

It's not a robotic arm. But it's a complete, working system — and honestly, the monitoring problem is arguably more valuable to solve first anyway.

---

## What It Does

An image from a drone or Raspberry Pi camera is uploaded to the platform. The backend automatically runs the right models based on farm type, classifies each fruit as ripe or unripe, detects plant diseases, attaches GPS coordinates, stores everything in a database, and feeds a harvest prediction engine. The frontend displays all of this on an interactive map with charts, weather forecasts, scan galleries, and harvest timelines.

**The full pipeline:**

```
Image → Farm Type Lookup → YOLOv8 Fruit Detection + Plant Disease Classifier
     → GPS Positioning → SQLite DB → Harvest Prediction → React Dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Fruit Detection | YOLOv8 (Ultralytics) — custom-trained lychee model |
| Disease Detection | YOLOv8 classification — PlantVillage dataset, 29 classes |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Auth | JWT tokens |
| Weather | OpenWeatherMap API |
| Frontend | React, styled-components, Leaflet maps, Recharts |
| Edge | Raspberry Pi 5 + Camera Module 3 |
| Language | Bilingual EN/ZH support |

---

## Models

Two AI models running on every image upload:

- **Lychee model** — specialized for lychee detection and ripeness classification (ripe/unripe based on HSV color analysis). Draws bounding boxes on annotated images saved per detection.
- **Plant disease classifier** — trained on the PlantVillage dataset. Detects 29 disease classes across 9 crops: Tomato, Potato, Pepper, Apple, Grape, Corn, Peach, Strawberry, Cherry. Confidence threshold of 60% — anything below is silently ignored to prevent false positives.

Which models run is determined automatically by the farm's `farm_type` — no manual selection needed.

---

## Farm Type System

Each farm has a `farm_type` set once at creation that controls which models run:

| Farm Type | Fruit Detection | Disease Detection |
|---|---|---|
| `lychee` | ✅ Lychee YOLOv8 | ✅ PlantVillage classifier |
| `plant_disease_only` | ❌ None | ✅ PlantVillage classifier |

The dashboard automatically switches view based on farm type — lychee farms show ripeness charts and harvest prediction, disease farms show health status and disease breakdown.

---

## Project Structure

```
fruitwatch/
├── backend/              # FastAPI app
│   ├── app/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Harvest predictor, weather
│   │   └── db/           # SQLAlchemy models
│   └── models/
│       ├── fruit_detections/     # Lychee YOLOv8 model
│       ├── plant_disease/        # PlantVillage classifier
│       │   ├── inference.py
│       │   ├── train.py
│       │   └── prepare_data.py
│       └── multi_inference.py    # Runs both models, returns combined result
├── frontend/             # React dashboard
│   └── src/
│       ├── components/
│       │   ├── dashboard/  # Main dashboard, charts, scan gallery
│       │   ├── map/        # Leaflet map + harvest route planner
│       │   └── shared/     # Theme, styled components
│       └── locales/        # EN/ZH translations
├── drone/                # Edge inference scripts
├── data/                 # Training data structure
└── script/               # Utility scripts
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Add your OpenWeatherMap API key
cp .env.example .env

# Run database migrations
python add_farm_type.py
python add_plant_disease_columns.py
python add_disease_toggle.py

# Start the server
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Dashboard runs at `http://localhost:3000`

---

## Environment Variables

Create `backend/.env`:

```
OPENWEATHER_API_KEY=your_key_here
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
```

---

## API Highlights

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | JWT login |
| POST | `/detections/process_drone_data` | Upload image → runs both models automatically |
| GET | `/detections/farm/{farm_id}` | All detections for a farm including image paths |
| GET | `/summary` | Farm summary with weather + harvest prediction |
| GET | `/farms/` | List farms with farm_type for authenticated user |
| POST | `/farms/` | Create farm with farm_type and disease toggle |
| GET | `/uploads/{path}` | Serve original and annotated images |

---

## Edge Inference (Raspberry Pi 5)

The platform supports standalone edge inference on a Raspberry Pi 5 with Camera Module 3.
No backend connection needed — the model runs directly on the device.

**Setup:**
```bash
python3 -m venv ~/fruitwatch-env --system-site-packages
source ~/fruitwatch-env/bin/activate
pip install ultralytics opencv-python-headless picamera2 --extra-index-url https://download.pytorch.org/whl/cpu
```

**Run live detection:**
```bash
python drone/inference_edge.py
```

Controls: `L` = lychee model · `Q` = quit

---

## Training the Plant Disease Model

```bash
cd backend/models/plant_disease

# Prepare dataset (merges per-plant folders into flat YOLOv8 classification structure)
python prepare_data.py

# Train
python train.py --epochs 50 --model n
```

Uses `yolov8n-cls.pt`, `imgsz=224`, CPU with `workers=0` for macOS stability. Achieved 99.8% top-1 accuracy on the PlantVillage validation set.

---

## Honest Limitations

This is a portfolio project, not production software.

**GPS positioning** uses simplified flat-earth math. Real drone software would use gimbal telemetry, barometric altitude, and lens distortion correction.

**Ripeness detection** on the lychee model uses color-based HSV thresholding — it's fragile in outdoor lighting conditions. A production system would train a separate ripeness classifier.

**Plant disease detection** is a leaf-level classifier trained on studio images. In the field, a drone would need close-up leaf photography for accurate results. Wide-angle tree shots would require a detection model with bounding boxes around individual leaves.

**Harvest prediction** is a linear formula based on ripe percentage, not a real ML model. It doesn't account for fruit variety growth curves or multi-season historical data.

These are known trade-offs made to ship a complete, working system within scope.

---

## What's Next

- Soil moisture and temperature sensors wiring into the same dashboard (hardware arriving soon)
- Per-tree grouping on the map

---

## What I Learned

I learned more building this than I would have building the robotic arm. Integrating custom-trained computer vision models into a production-style API, building a full-stack application with real data flow, designing a UI that communicates complex farm data clearly, and running inference on edge hardware — that took real problem-solving at every layer.

The soft robotics idea isn't dead. It's just next.

---

## License

MIT

---

*Built by [@SimenVangen](https://github.com/SimenVangen)*
