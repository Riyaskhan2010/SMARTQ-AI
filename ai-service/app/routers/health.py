from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "SmartQ AI Prediction Service", "timestamp": datetime.utcnow()}
