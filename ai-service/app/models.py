"""Pydantic request/response models for the AI service."""
from pydantic import BaseModel, Field
from typing import Optional


class PredictRequest(BaseModel):
    waiting_count: int = Field(..., ge=0, description="Number of tokens currently waiting")
    active_counters: int = Field(..., ge=0, description="Number of open service counters")
    avg_service_time: float = Field(8.0, ge=1, description="Average service time in minutes")
    hour_of_day: int = Field(10, ge=0, le=23, description="Current hour (0-23)")
    day_of_week: int = Field(1, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")
    no_show_rate: float = Field(0.08, ge=0, le=1, description="Historical no-show rate")
    queue_id: Optional[str] = None


class PredictResponse(BaseModel):
    estimated_wait: int
    crowd_level: str
    confidence: float
    recommendation: str
    active_counters: int
    waiting_count: int
    model_used: str


class SimulateRequest(BaseModel):
    waiting_count: int
    active_counters: int
    avg_service_time: float = 8.0
    delta_counters: int = 0
    delta_arrival_rate: float = 0.0
    delta_service_time: float = 0.0


class SimulateResponse(BaseModel):
    current_eta: int
    simulated_eta: int
    improvement: int
    current_crowd: str
    simulated_crowd: str
    recommendation: str
