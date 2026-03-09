from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field


class PredictionBase(BaseModel):
    latitude: float
    longitude: float
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    rainfall: float
    cloud_cover: float


class PredictionCreate(PredictionBase):
    """Input for creating a new prediction (DB persistence)."""


class PredictionResponse(PredictionBase):
    id: int
    prediction_result: str
    risk_level: str
    confidence_score: float
    created_at: datetime

    class Config:
        orm_mode = True


class PredictionMLRequest(BaseModel):
    latitude: float
    longitude: float
    temperature: float
    humidity: float
    atmospheric_pressure: float
    wind_speed: float
    rainfall_last_24h: float
    cloud_cover: float
    dew_point: Optional[float] = None
    altitude: float = 0.0


class PredictionMLResult(BaseModel):
    prediction: int = Field(..., description="0 = no cloud burst, 1 = cloud burst likely")
    probability: float
    risk_level: str
    risk_score: float


class PredictionAPIResponse(BaseModel):
    input: PredictionMLRequest
    result: PredictionMLResult


class BatchPredictionItem(BaseModel):
    index: int
    input: Dict[str, Any]
    result: Optional[PredictionMLResult] = None
    error: Optional[str] = None


class BatchPredictionResponse(BaseModel):
    items: List[BatchPredictionItem]


class ModelInfoResponse(BaseModel):
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    features: List[str]
    feature_importance: Dict[str, float]


class WeatherAlertBase(BaseModel):
    region: str
    alert_type: str
    severity: str
    message: str
    is_active: bool = True


class WeatherAlertCreate(WeatherAlertBase):
    """Input for creating a new weather alert."""


class WeatherAlertUpdateStatus(BaseModel):
    is_active: bool


class WeatherAlertResponse(WeatherAlertBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class WeatherCurrentResponse(BaseModel):
    source: str
    latitude: float
    longitude: float
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    rainfall_last_24h: float
    cloud_cover: float
    description: Optional[str] = None


class WeatherForecastItem(BaseModel):
    timestamp: int
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    rainfall_3h: float = 0.0
    cloud_cover: float
    description: Optional[str] = None


class WeatherForecastResponse(BaseModel):
    source: str
    latitude: float
    longitude: float
    items: List[WeatherForecastItem]


class WeatherAnalyzeRequest(BaseModel):
    latitude: float
    longitude: float
    temperature: float
    humidity: float
    atmospheric_pressure: float
    wind_speed: float
    rainfall_last_24h: float
    cloud_cover: float
    dew_point: Optional[float] = None
    altitude: float = 0.0


class WeatherAnalyzeResponse(BaseModel):
    weather: WeatherCurrentResponse
    prediction: PredictionMLResult