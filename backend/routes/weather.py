from __future__ import annotations

from typing import Optional, Dict, Any, List

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config import settings
from database import get_db
import db_models as models
import schemas
from models.predict import predict_cloudburst


router = APIRouter(tags=["weather"])

OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"


def _call_openweather(endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
    api_key = settings.WEATHER_API_KEY
    if not api_key:
        # No key configured - caller should handle this case
        raise RuntimeError("OPENWEATHER_API_KEY not configured")

    params = dict(params)
    params["appid"] = api_key
    params.setdefault("units", "metric")

    resp = requests.get(f"{OPENWEATHER_BASE_URL}/{endpoint}", params=params, timeout=10)
    if not resp.ok:
        raise HTTPException(status_code=resp.status_code, detail=f"OpenWeatherMap error: {resp.text}")
    return resp.json()


def _mock_current_weather(lat: float, lon: float) -> schemas.WeatherCurrentResponse:
    """Return deterministic mock data when API key is missing."""
    return schemas.WeatherCurrentResponse(
        source="mock",
        latitude=lat,
        longitude=lon,
        temperature=25.0,
        humidity=70.0,
        pressure=1005.0,
        wind_speed=10.0,
        rainfall_last_24h=20.0,
        cloud_cover=60.0,
        description="Partly cloudy (mock)",
    )


@router.get("/api/weather/current", response_model=schemas.WeatherCurrentResponse)
def get_current_weather(
    lat: float = Query(...),
    lon: float = Query(...),
):
    """
    Fetch current weather from OpenWeatherMap for the given coordinates.
    If API key is not configured, returns mock data instead.
    """
    try:
        data = _call_openweather("weather", {"lat": lat, "lon": lon})
        rain_1h = float(data.get("rain", {}).get("1h", 0.0))
        rain_3h = float(data.get("rain", {}).get("3h", 0.0))
        rainfall_24h = max(rain_1h, rain_3h)  # approximate

        return schemas.WeatherCurrentResponse(
            source="openweathermap",
            latitude=float(data["coord"]["lat"]),
            longitude=float(data["coord"]["lon"]),
            temperature=float(data["main"]["temp"]),
            humidity=float(data["main"]["humidity"]),
            pressure=float(data["main"]["pressure"]),
            wind_speed=float(data.get("wind", {}).get("speed", 0.0)),
            rainfall_last_24h=rainfall_24h,
            cloud_cover=float(data.get("clouds", {}).get("all", 0.0)),
            description=str(data.get("weather", [{}])[0].get("description", "")),
        )
    except RuntimeError:
        # No API key configured - return mock data
        return _mock_current_weather(lat, lon)


@router.get("/api/weather/forecast", response_model=schemas.WeatherForecastResponse)
def get_weather_forecast(
    lat: float = Query(...),
    lon: float = Query(...),
):
    """
    Fetch 5-day forecast from OpenWeatherMap for the given coordinates.
    If API key is not configured, returns a simple mock forecast.
    """
    try:
        data = _call_openweather("forecast", {"lat": lat, "lon": lon})
        items: List[schemas.WeatherForecastItem] = []
        for entry in data.get("list", []):
            main = entry.get("main", {})
            wind = entry.get("wind", {})
            clouds = entry.get("clouds", {})
            rain = entry.get("rain", {})
            items.append(
                schemas.WeatherForecastItem(
                    timestamp=int(entry.get("dt", 0)),
                    temperature=float(main.get("temp", 0.0)),
                    humidity=float(main.get("humidity", 0.0)),
                    pressure=float(main.get("pressure", 0.0)),
                    wind_speed=float(wind.get("speed", 0.0)),
                    rainfall_3h=float(rain.get("3h", 0.0)),
                    cloud_cover=float(clouds.get("all", 0.0)),
                    description=str(entry.get("weather", [{}])[0].get("description", "")),
                )
            )

        coord = data.get("city", {}).get("coord", {"lat": lat, "lon": lon})
        return schemas.WeatherForecastResponse(
            source="openweathermap",
            latitude=float(coord.get("lat", lat)),
            longitude=float(coord.get("lon", lon)),
            items=items,
        )
    except RuntimeError:
        # No API key - create a simple mock forecast
        mock_items = [
            schemas.WeatherForecastItem(
                timestamp=0,
                temperature=25.0,
                humidity=70.0,
                pressure=1005.0,
                wind_speed=10.0,
                rainfall_3h=5.0,
                cloud_cover=60.0,
                description="Mock forecast",
            )
        ]
        return schemas.WeatherForecastResponse(
            source="mock",
            latitude=lat,
            longitude=lon,
            items=mock_items,
        )


@router.post("/api/weather/analyze", response_model=schemas.WeatherAnalyzeResponse)
def analyze_weather(
    payload: schemas.WeatherAnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze weather data and auto-predict cloudburst risk.

    Saves the prediction to the database.
    """
    from routes.prediction import _compute_dew_point_if_missing, _save_prediction_to_db  # reuse helpers

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

    # Build a simplified "current weather" view from the input
    weather_view = schemas.WeatherCurrentResponse(
        source="analyze-input",
        latitude=payload.latitude,
        longitude=payload.longitude,
        temperature=payload.temperature,
        humidity=payload.humidity,
        pressure=payload.atmospheric_pressure,
        wind_speed=payload.wind_speed,
        rainfall_last_24h=payload.rainfall_last_24h,
        cloud_cover=payload.cloud_cover,
        description=None,
    )

    # Persist prediction
    pred_payload = schemas.PredictionMLRequest(
        latitude=payload.latitude,
        longitude=payload.longitude,
        temperature=payload.temperature,
        humidity=payload.humidity,
        atmospheric_pressure=payload.atmospheric_pressure,
        wind_speed=payload.wind_speed,
        rainfall_last_24h=payload.rainfall_last_24h,
        cloud_cover=payload.cloud_cover,
        dew_point=dew_point,
        altitude=payload.altitude,
    )
    _save_prediction_to_db(db, pred_payload, result)

    return schemas.WeatherAnalyzeResponse(weather=weather_view, prediction=result)

