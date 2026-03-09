from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import db_models as models
import schemas

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/", response_model=schemas.PredictionResponse)
def create_prediction(
    payload: schemas.PredictionCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new cloud burst prediction record.

    This currently uses a simple rule-based placeholder instead of a trained ML model.
    You can later replace the logic with a scikit-learn model loaded via joblib.
    """
    # Placeholder prediction logic
    risk_score = (
        payload.rainfall * 0.4
        + payload.humidity * 0.3
        + payload.cloud_cover * 0.2
        + payload.wind_speed * 0.1
    )

    if risk_score > 140:
        prediction_result = "cloud_burst_likely"
        risk_level = "high"
    elif risk_score > 100:
        prediction_result = "cloud_burst_possible"
        risk_level = "medium"
    else:
        prediction_result = "cloud_burst_unlikely"
        risk_level = "low"

    confidence_score = min(0.99, max(0.5, risk_score / 200))

    db_obj = models.PredictionRecord(
        latitude=payload.latitude,
        longitude=payload.longitude,
        temperature=payload.temperature,
        humidity=payload.humidity,
        pressure=payload.pressure,
        wind_speed=payload.wind_speed,
        rainfall=payload.rainfall,
        cloud_cover=payload.cloud_cover,
        prediction_result=prediction_result,
        risk_level=risk_level,
        confidence_score=confidence_score,
        created_at=datetime.utcnow(),
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.get("/", response_model=List[schemas.PredictionResponse])
def list_predictions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List recent prediction records."""
    return (
        db.query(models.PredictionRecord)
        .order_by(models.PredictionRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

