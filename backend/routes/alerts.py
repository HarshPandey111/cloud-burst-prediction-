from __future__ import annotations

from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
import db_models as models
import schemas


router = APIRouter(tags=["alerts"])


@router.get("/api/alerts", response_model=List[schemas.WeatherAlertResponse])
def get_alerts(
    active_only: bool = Query(True, description="If true, return only active alerts"),
    db: Session = Depends(get_db),
):
    """Get all alerts, optionally filtering to only active ones."""
    query = db.query(models.WeatherAlert)
    if active_only:
        query = query.filter(models.WeatherAlert.is_active.is_(True))
    return query.order_by(models.WeatherAlert.created_at.desc()).all()


@router.post("/api/alerts", response_model=schemas.WeatherAlertResponse)
def create_alert(
    payload: schemas.WeatherAlertCreate,
    db: Session = Depends(get_db),
):
    """Create a new alert."""
    db_obj = models.WeatherAlert(
        region=payload.region,
        alert_type=payload.alert_type,
        severity=payload.severity,
        message=payload.message,
        is_active=payload.is_active,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.put("/api/alerts/{alert_id}", response_model=schemas.WeatherAlertResponse)
def update_alert_status(
    alert_id: int,
    payload: schemas.WeatherAlertUpdateStatus,
    db: Session = Depends(get_db),
):
    """Update alert active status."""
    alert = db.query(models.WeatherAlert).filter(models.WeatherAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = payload.is_active
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/api/alerts/regions")
def get_high_risk_regions(
    db: Session = Depends(get_db),
):
    """
    Get high-risk regions based on active alerts.

    Returns regions with at least one active alert, along with counts.
    """
    rows = (
        db.query(models.WeatherAlert.region)
        .filter(models.WeatherAlert.is_active.is_(True))
        .all()
    )
    region_counts: Dict[str, int] = {}
    for (region,) in rows:
        region_counts[region] = region_counts.get(region, 0) + 1

    return {"regions": region_counts}

