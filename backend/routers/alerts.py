from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import db_models as models
import schemas

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/", response_model=schemas.WeatherAlertResponse)
def create_alert(
    payload: schemas.WeatherAlertCreate,
    db: Session = Depends(get_db),
):
    """Create a new weather alert."""
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


@router.get("/", response_model=List[schemas.WeatherAlertResponse])
def list_alerts(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """List weather alerts, optionally filtering by active status."""
    query = db.query(models.WeatherAlert)
    if active_only:
        query = query.filter(models.WeatherAlert.is_active.is_(True))
    return query.order_by(models.WeatherAlert.created_at.desc()).all()


@router.patch("/{alert_id}", response_model=schemas.WeatherAlertResponse)
def toggle_alert_active(
    alert_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
):
    """Activate or deactivate an alert."""
    alert = db.query(models.WeatherAlert).filter(models.WeatherAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = is_active
    db.commit()
    db.refresh(alert)
    return alert

