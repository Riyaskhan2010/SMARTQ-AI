"""
SmartQ AI Prediction Engine
----------------------------
Implements a transparent, explainable queue wait-time predictor.
Uses a trained RandomForest model when available; falls back to a
mathematically sound formula-based predictor otherwise.

Formula rationale:
  Base ETA = (waiting / active_counters) * avg_service_time
  Time-of-day multiplier: peak hours (9-11, 14-16) get +15-25%
  Day-of-week multiplier: Mon/Fri get +10%
  No-show discount: reduce effective queue by no_show_rate
"""
import math
import numpy as np
from typing import Tuple

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import LabelEncoder
    import pickle, os
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


# ── Transparent formula predictor (always available) ─────────────

PEAK_HOURS = {9: 1.25, 10: 1.25, 11: 1.15, 14: 1.20, 15: 1.20, 16: 1.10}
PEAK_DAYS  = {0: 1.10, 4: 1.10}  # Monday=0, Friday=4

def formula_predict(
    waiting_count: int,
    active_counters: int,
    avg_service_time: float,
    hour_of_day: int,
    day_of_week: int,
    no_show_rate: float,
) -> Tuple[int, float]:
    """
    Returns (estimated_wait_minutes, confidence_score).
    """
    if active_counters <= 0:
        return 99, 0.5

    # Effective queue after no-shows
    effective_waiting = max(0, waiting_count * (1 - no_show_rate))

    # Base wait
    base_wait = (effective_waiting / active_counters) * avg_service_time

    # Time-of-day multiplier
    tod_mult = PEAK_HOURS.get(hour_of_day, 1.0)

    # Day-of-week multiplier
    dow_mult = PEAK_DAYS.get(day_of_week, 1.0)

    # Final prediction
    predicted = base_wait * tod_mult * dow_mult

    # Confidence: higher when we have more counters and moderate queue
    ratio = waiting_count / max(1, active_counters)
    confidence = min(0.95, 0.60 + active_counters * 0.05 - abs(ratio - 5) * 0.01)
    confidence = max(0.45, confidence)

    return max(0, math.ceil(predicted)), round(confidence, 2)


def get_crowd_level(waiting_count: int, active_counters: int) -> str:
    if active_counters == 0:
        return "VERY_HIGH"
    ratio = waiting_count / active_counters
    if ratio <= 3:   return "LOW"
    if ratio <= 7:   return "MEDIUM"
    if ratio <= 12:  return "HIGH"
    return "VERY_HIGH"


def generate_recommendation(
    waiting_count: int,
    active_counters: int,
    estimated_wait: int,
    avg_service_time: float,
) -> str:
    if active_counters == 0:
        return "No active counters. Please open at least one counter to serve patients."

    ratio = waiting_count / max(1, active_counters)

    if ratio > 10:
        improvement = math.ceil(estimated_wait * 0.30)
        return (
            f"Very high crowd detected ({waiting_count} waiting, {active_counters} counters). "
            f"Opening Counter {active_counters + 1} could reduce wait time by ~{improvement} min."
        )
    elif ratio > 7:
        improvement = math.ceil(estimated_wait * 0.25)
        return (
            f"High crowd detected. Opening Counter {active_counters + 1} "
            f"may reduce average wait by ~{improvement} minutes."
        )
    elif ratio < 2 and active_counters > 1:
        return (
            f"Low crowd ({waiting_count} waiting). "
            f"Counter {active_counters} can be closed to reallocate staff."
        )
    else:
        return f"Queue operating normally. Estimated wait: {estimated_wait} min. No action required."


# ── Sklearn model (optional) ──────────────────────────────────────

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def _load_or_train_model():
    """Train a small RandomForest on synthetic queue data for demo."""
    if not SKLEARN_AVAILABLE:
        return None

    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)

    # Generate synthetic training data
    rng = np.random.default_rng(42)
    n = 3000
    waiting   = rng.integers(0, 60, n)
    counters  = rng.integers(1, 8, n)
    svc_time  = rng.uniform(3, 20, n)
    hour      = rng.integers(8, 18, n)
    dow       = rng.integers(0, 7, n)
    no_show   = rng.uniform(0.03, 0.15, n)

    # Compute formula label with noise
    y = np.array([
        formula_predict(waiting[i], counters[i], svc_time[i], hour[i], dow[i], no_show[i])[0]
        + rng.normal(0, 1.5)
        for i in range(n)
    ]).clip(0)

    X = np.column_stack([waiting, counters, svc_time, hour, dow, no_show])

    model = RandomForestRegressor(n_estimators=80, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    return model


_model = _load_or_train_model()


def predict(
    waiting_count: int,
    active_counters: int,
    avg_service_time: float = 8.0,
    hour_of_day: int = 10,
    day_of_week: int = 1,
    no_show_rate: float = 0.08,
) -> dict:
    model_used = "formula"
    estimated_wait, confidence = formula_predict(
        waiting_count, active_counters, avg_service_time,
        hour_of_day, day_of_week, no_show_rate,
    )

    if _model is not None:
        try:
            X = np.array([[waiting_count, active_counters, avg_service_time,
                           hour_of_day, day_of_week, no_show_rate]])
            ml_pred = max(0, int(round(_model.predict(X)[0])))
            # Blend: 60% ML + 40% formula
            estimated_wait = int(round(0.6 * ml_pred + 0.4 * estimated_wait))
            confidence = min(0.95, confidence + 0.08)
            model_used = "random_forest+formula"
        except Exception:
            pass  # Fall through to formula result

    crowd_level    = get_crowd_level(waiting_count, active_counters)
    recommendation = generate_recommendation(waiting_count, active_counters, estimated_wait, avg_service_time)

    return {
        "estimated_wait": estimated_wait,
        "crowd_level":    crowd_level,
        "confidence":     confidence,
        "recommendation": recommendation,
        "active_counters": active_counters,
        "waiting_count":  waiting_count,
        "model_used":     model_used,
    }
