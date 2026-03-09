"""
Prediction utilities for Cloud Burst models.

Provides helpers to load the trained classifier and risk regressor and to
compute prediction, probability, risk_score and categorized risk_level.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd

from config import settings


FEATURE_COLUMNS = [
    "temperature",
    "humidity",
    "atmospheric_pressure",
    "wind_speed",
    "rainfall_last_24h",
    "cloud_cover",
    "dew_point",
    "altitude",
]


@lru_cache(maxsize=1)
def load_classifier():
    """Load the classification model from disk."""
    data = joblib.load(settings.MODEL_PATH)
    model = data["model"]
    features = data.get("features", FEATURE_COLUMNS)
    return model, features


@lru_cache(maxsize=1)
def load_risk_regressor():
    """Load the risk score regression model from disk."""
    data = joblib.load(settings.RISK_MODEL_PATH)
    model = data["model"]
    features = data.get("features", FEATURE_COLUMNS)
    return model, features


def _prepare_feature_vector(features_dict: Dict[str, Any], feature_order):
    """Convert an input dict into a feature vector in the right order."""
    row = [float(features_dict[name]) for name in feature_order]
    return pd.DataFrame([row], columns=feature_order)


def _risk_level_from_score(score: float) -> str:
    """Map numerical risk score (0-100) to categorical risk level."""
    if score < 25:
        return "Low"
    if score < 50:
        return "Moderate"
    if score < 75:
        return "High"
    return "Extreme"


def predict_cloudburst(features_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predict cloud burst occurrence and risk from feature dictionary.

    Args:
        features_dict: dict with keys:
            temperature, humidity, atmospheric_pressure, wind_speed,
            rainfall_last_24h, cloud_cover, dew_point, altitude

    Returns:
        {
          "prediction": int (0/1),
          "probability": float,
          "risk_level": str,
          "risk_score": float
        }
    """
    clf, clf_features = load_classifier()
    reg, reg_features = load_risk_regressor()

    X_clf = _prepare_feature_vector(features_dict, clf_features)
    X_reg = _prepare_feature_vector(features_dict, reg_features)

    # Classification prediction and probability
    if hasattr(clf, "predict_proba"):
        proba = float(clf.predict_proba(X_clf)[0, 1])
    else:
        # Fallback: use decision function if available, then squash
        if hasattr(clf, "decision_function"):
            decision = float(clf.decision_function(X_clf)[0])
            proba = 1.0 / (1.0 + np.exp(-decision))
        else:
            proba = float(clf.predict(X_clf)[0])

    pred = int(clf.predict(X_clf)[0])

    # Risk score regression
    risk_score = float(reg.predict(X_reg)[0])
    risk_score = float(np.clip(risk_score, 0.0, 100.0))

    risk_level = _risk_level_from_score(risk_score)

    return {
        "prediction": pred,
        "probability": proba,
        "risk_level": risk_level,
        "risk_score": risk_score,
    }


def get_feature_importance() -> Dict[str, float]:
    """
    Return feature importances from the classifier model, if available.

    Returns:
        dict mapping feature name to importance (sorted descending).
        If the classifier does not support feature_importances_, returns an empty dict.
    """
    clf, feature_order = load_classifier()
    if not hasattr(clf, "feature_importances_"):
        return {}

    importances = clf.feature_importances_
    importance_dict = {name: float(imp) for name, imp in zip(feature_order, importances)}
    # Sort by importance descending
    return dict(sorted(importance_dict.items(), key=lambda item: item[1], reverse=True))

