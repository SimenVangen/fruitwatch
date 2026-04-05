# 🌾 FruitWatch — AI-Powered Fruit Monitoring Platform

> Drone-based fruit detection, ripeness analysis, and harvest prediction. Built with YOLOv8, FastAPI, and React.

---

## The Idea

It started with a simple frustration: fruit picking is hard, dangerous, and inefficient — especially on mountain terrain where workers risk injury every season.

My original plan was ambitious. I wanted to build a **soft robotic hand** that could autonomously pick lychee fruits from trees. I read research papers, studied actuator designs, looked into pneumatic grippers and compliant mechanisms. It was genuinely fascinating work.

Then reality hit. I didn't have the hardware. I didn't have the manufacturing capability. And honestly, I didn't have the mechanical engineering background to make it work at any meaningful level. The papers I was reading were from PhD labs with years of funding and specialized equipment.

So I scaled down — but not in ambition.

Instead of a hand that picks fruit, I built a **brain that monitors it**. A full-stack AI platform that lets a drone fly over an orchard, detect and classify fruits, map their GPS coordinates, predict harvest readiness, and display everything in a real-time dashboard.

It's not a robotic arm. But it's a complete, working system — and honestly, the monitoring problem is arguably more valuable to solve first anyway.

---

## What It Does

A drone uploads images to the platform. The backend runs YOLOv8 inference, classifies each fruit as ripe or unripe, attaches GPS coordinates, stores everything in a database, and feeds a harvest prediction engine. The frontend displays all of this on an interactive map with charts, weather forecasts, and harvest timelines.

**The full pipeline:**

```
Drone Image → YOLOv8 Detection → GPS Positioning → SQLite DB → Harvest Prediction → React Dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Detection | YOLOv8 (Ultralytics) — two custom-trained models |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Auth | JWT tokens |
| Weather | OpenWeatherMap API |
| Frontend | React, styled-components, Leaflet maps, Recharts |
| Language | Bilingual EN/ZH support |

---

## Models

Two YOLOv8 models trained from scratch:

- **Lychee model** — specialized for lychee detection and ripeness classification (ripe/unripe based on color)
- **360 multi-fruit model** — detects apple, banana, grape, orange, pineapple, watermelon

The model switcher in the upload API lets you choose which model processes each image.

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
│       ├── fruit_detections/       # Lychee YOLOv8 model
│       └── fruit_detections_360/   # Multi-fruit YOLOv8 model
├── frontend/             # React dashboard
│   └── src/
│       ├── components/
│       │   ├── dashboard/  # Main dashboard, charts, prediction
│       │   ├── map/        # Leaflet map + harvest route planner
│       │   └── shared/     # Theme, styled components
│       └── locales/        # EN/ZH translations
├── website/              # Marketing site
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
| POST | `/detections/process_drone_data` | Upload image + GPS → run inference |
| GET | `/detections/farm/{farm_id}` | Get all detections for a farm |
| GET | `/summary` | Farm summary with weather + harvest prediction |
| GET | `/farms` | List farms for authenticated user |

---

## Honest Limitations

This is a portfolio project, not production software.

**GPS positioning** uses simplified flat-earth math. Real drone software would use gimbal telemetry, barometric altitude, and lens distortion correction.

**Ripeness detection** on the lychee model uses color-based HSV thresholding — it's fragile in outdoor lighting conditions. A production system would train a separate ripeness classifier.

**Harvest prediction** is a linear formula based on ripe percentage, not a real ML model. It doesn't account for fruit variety growth curves or multi-season historical data.

These are known trade-offs made to ship a complete, working system within scope.

---

## What I Learned

I learned more building this than I would have building the robotic arm. Integrating a custom-trained computer vision model into a production-style API, building a full-stack application with real data flow, and designing a UI that actually communicates complex farm data clearly — that took real problem-solving at every layer.

The soft robotics idea isn't dead. It's just next.

---

## License

MIT

---

*Built by [@SimenVangen](https://github.com/SimenVangen)*
