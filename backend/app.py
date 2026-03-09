from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import predictions as legacy_predictions
from routers import alerts as legacy_alerts
from routes import prediction as prediction_routes
from routes import weather as weather_routes
from routes import alerts as alert_routes

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud Burst Prediction and Risk Analysis API",
    version="1.0.0",
)

# CORS configuration for React app
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Legacy routers
app.include_router(legacy_predictions.router, prefix="/api")
app.include_router(legacy_alerts.router, prefix="/api")

# New routers
app.include_router(prediction_routes.router)
app.include_router(weather_routes.router)
app.include_router(alert_routes.router)


@app.get("/")
def read_root():
    return {"message": "Cloud Burst Prediction and Risk Analysis API is running"}