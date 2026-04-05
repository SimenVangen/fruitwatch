from fastapi import APIRouter

router = APIRouter(prefix="/sensors", tags=["Sensors"])


@router.get("/")
async def get_sensors():
    return {
        "sensors": [
            {"id": 1, "type": "moisture", "status": "active"},
            {"id": 2, "type": "temperature", "status": "active"},
            {"id": 3, "type": "humidity", "status": "inactive"},
        ]
    }