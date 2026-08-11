from fastapi import APIRouter
from app.models import PredictRequest, PredictResponse, SimulateRequest, SimulateResponse
from app import predictor
import math

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
def predict_wait(req: PredictRequest):
    result = predictor.predict(
        waiting_count=req.waiting_count,
        active_counters=req.active_counters,
        avg_service_time=req.avg_service_time,
        hour_of_day=req.hour_of_day,
        day_of_week=req.day_of_week,
        no_show_rate=req.no_show_rate,
    )
    return PredictResponse(**result)


@router.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    # Current state
    current_eta, _ = predictor.formula_predict(
        req.waiting_count, req.active_counters, req.avg_service_time,
        10, 1, 0.08,
    )
    current_crowd = predictor.get_crowd_level(req.waiting_count, req.active_counters)

    # Simulated state
    sim_counters    = max(0, req.active_counters + req.delta_counters)
    sim_waiting     = max(0, int(req.waiting_count * (1 + req.delta_arrival_rate / 100)))
    sim_service_time = max(1.0, req.avg_service_time + req.delta_service_time)

    sim_eta, _ = predictor.formula_predict(
        sim_waiting, sim_counters, sim_service_time, 10, 1, 0.08,
    )
    sim_crowd    = predictor.get_crowd_level(sim_waiting, sim_counters)
    improvement  = current_eta - sim_eta

    if improvement > 0:
        rec = f"This change reduces average wait time by ~{improvement} minutes."
    elif improvement < 0:
        rec = f"This change increases average wait time by ~{abs(improvement)} minutes."
    else:
        rec = "No significant impact expected."

    return SimulateResponse(
        current_eta=current_eta,
        simulated_eta=sim_eta,
        improvement=improvement,
        current_crowd=current_crowd,
        simulated_crowd=sim_crowd,
        recommendation=rec,
    )


@router.get("/crowd")
def crowd_info(waiting: int = 0, counters: int = 1):
    return {
        "crowd_level": predictor.get_crowd_level(waiting, counters),
        "ratio": round(waiting / max(1, counters), 2),
    }
