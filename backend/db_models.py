from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean

from database import Base


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    cloud_cover = Column(Float, nullable=False)

    prediction_result = Column(String, nullable=False)
    risk_level = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

