from __future__ import annotations

from typing import List

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from sklearn.metrics import accuracy_score, f1_score
from sqlalchemy.orm import Session

from database import get_db
import db_models as models
import schemas
from models.predict import predict_cloudburst, get_feature_importance, FEATURE_COLUMNS
from models.train_model import generate_synthetic_data


router = APIRouter(tags=["prediction"])


def _compute_dew_point_if_missing(temperature: float, humidity: float, dew_point: float | None) -> float:
    if dew_point is not None:
        return dew_point
    # Simple approximation, consistent with training
    return temperature - (100 - humidity) / 5.0


def _save_prediction_to_db(
    db: Session,
    payload: schemas.PredictionMLRequest,
    result: schemas.PredictionMLResult,
) -> models.PredictionRecord:
    pred_label = "cloud_burst" if result.prediction == 1 else "no_cloud_burst"

    db_obj = models.PredictionRecord(
        latitude=payload.latitude,
        longitude=payload.longitude,
        temperature=payload.temperature,
        humidity=payload.humidity,
        pressure=payload.atmospheric_pressure,
        wind_speed=payload.wind_speed,
        rainfall=payload.rainfall_last_24h,
        cloud_cover=payload.cloud_cover,
        prediction_result=pred_label,
        risk_level=result.risk_level.lower(),
        confidence_score=result.probability,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.post("/api/predict", response_model=schemas.PredictionAPIResponse)
def predict_endpoint(
    payload: schemas.PredictionMLRequest,
    db: Session = Depends(get_db),
):
    """
    Predict cloud burst risk for a single set of weather parameters.
    """
    dew_point = _compute_dew_point_if_missing(payload.temperature, payload.humidity, payload.dew_point)

    features = {
        "temperature": payload.temperature,
        "humidity": payload.humidity,
        "atmospheric_pressure": payload.atmospheric_pressure,
        "wind_speed": payload.wind_speed,
        "rainfall_last_24h": payload.rainfall_last_24h,
        "cloud_cover": payload.cloud_cover,
        "dew_point": dew_point,
        "altitude": payload.altitude,
    }

    try:
        raw_result = predict_cloudburst(features)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Model files not found. Please run the training script first.")

    result = schemas.PredictionMLResult(**raw_result)

    # Persist to DB
    _save_prediction_to_db(db, payload, result)

    return schemas.PredictionAPIResponse(input=payload, result=result)


@router.post("/api/predict/batch", response_model=schemas.BatchPredictionResponse)
async def predict_batch_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Run predictions for each row in an uploaded CSV file.

    The CSV should contain columns matching the model features:
    temperature, humidity, atmospheric_pressure, wind_speed,
    rainfall_last_24h, cloud_cover, dew_point (optional), altitude (optional),
    latitude, longitude.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        df = pd.read_csv(pd.io.common.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read CSV file: {exc}")

    required_cols = {
        "temperature",
        "humidity",
        "atmospheric_pressure",
        "wind_speed",
        "rainfall_last_24h",
        "cloud_cover",
        "latitude",
        "longitude",
    }

    missing = required_cols - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns in CSV: {', '.join(sorted(missing))}")

    items: List[schemas.BatchPredictionItem] = []

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        try:
            dew_point = _compute_dew_point_if_missing(
                float(row_dict["temperature"]),
                float(row_dict["humidity"]),
                float(row_dict.get("dew_point")) if "dew_point" in row_dict else None,
            )
            altitude = float(row_dict.get("altitude", 0.0))

            features = {
                "temperature": float(row_dict["temperature"]),
                "humidity": float(row_dict["humidity"]),
                "atmospheric_pressure": float(row_dict["atmospheric_pressure"]),
                "wind_speed": float(row_dict["wind_speed"]),
                "rainfall_last_24h": float(row_dict["rainfall_last_24h"]),
                "cloud_cover": float(row_dict["cloud_cover"]),
                "dew_point": dew_point,
                "altitude": altitude,
            }
            raw_result = predict_cloudburst(features)
            result = schemas.PredictionMLResult(**raw_result)

            payload = schemas.PredictionMLRequest(
                latitude=float(row_dict["latitude"]),
                longitude=float(row_dict["longitude"]),
                temperature=features["temperature"],
                humidity=features["humidity"],
                atmospheric_pressure=features["atmospheric_pressure"],
                wind_speed=features["wind_speed"],
                rainfall_last_24h=features["rainfall_last_24h"],
                cloud_cover=features["cloud_cover"],
                dew_point=features["dew_point"],
                altitude=features["altitude"],
            )

            _save_prediction_to_db(db, payload, result)

            items.append(
                schemas.BatchPredictionItem(
                    index=int(idx),
                    input=row_dict,
                    result=result,
                )
            )
        except Exception as exc:  # noqa: BLE001
            items.append(
                schemas.BatchPredictionItem(
                    index=int(idx),
                    input=row_dict,
                    error=str(exc),
                )
            )

    return schemas.BatchPredictionResponse(items=items)


@router.get("/api/predictions/history", response_model=List[schemas.PredictionResponse])
def get_prediction_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Return past predictions from the database with pagination.
    """
    return (
        db.query(models.PredictionRecord)
        .order_by(models.PredictionRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/api/model/info", response_model=schemas.ModelInfoResponse)
def get_model_info():
    """
    Return model accuracy (approximate on fresh synthetic data), features, and feature importance.
    """
    # Generate a moderate-sized synthetic dataset for quick evaluation
    df = generate_synthetic_data(n_samples=2000)
    X = df[FEATURE_COLUMNS]
    y = df["cloud_burst"]

    from models.predict import load_classifier  # local import to avoid circulars at import time

    clf, feature_order = load_classifier()
    y_pred = clf.predict(X[feature_order])

    acc = float(accuracy_score(y, y_pred))
    f1 = float(f1_score(y, y_pred))

    importance = get_feature_importance()

    return schemas.ModelInfoResponse(
        accuracy=acc,
        f1_score=f1,
        features=feature_order,
        feature_importance=importance,
    )

