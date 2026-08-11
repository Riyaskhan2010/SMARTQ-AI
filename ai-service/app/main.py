"""
SmartQ AI - FastAPI Prediction Service
Provides ML-based queue wait time prediction, crowd level estimation,
and AI recommendations. Falls back to transparent algorithm if model
is not yet trained.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, health

app = FastAPI(
    title="SmartQ AI Prediction Service",
    description="Intelligent queue wait-time prediction and crowd analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router)
