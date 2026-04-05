from fastapi import APIRouter

router = APIRouter(prefix="/forecast", tags=["Forecast"])

@router.get("/")
async def get_forecast():
    return {"message": "Forecast endpoint working!"}