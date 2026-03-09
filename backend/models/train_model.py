"""
Training script for Cloud Burst Prediction models.

Generates synthetic weather data, trains:
- Classification models (RandomForest, GradientBoosting) to predict cloud burst events
- A regression model to estimate a continuous risk_score (0-100)

The best classifier is saved as `model.pkl` and the regressor as `risk_model.pkl`
under the backend/models directory.
"""

from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor, RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import classification_report
from sklearn.model_selection import cross_val_score, train_test_split

HERE = Path(__file__).resolve().parent


def generate_synthetic_data(n_samples: int = 10_000, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)

    temperature = rng.uniform(5, 40, size=n_samples)
    humidity = rng.uniform(40, 100, size=n_samples)
    atmospheric_pressure = rng.uniform(950, 1050, size=n_samples)
    wind_speed = rng.uniform(0, 120, size=n_samples)
    rainfall_last_24h = rng.uniform(0, 300, size=n_samples)
    cloud_cover = rng.uniform(0, 100, size=n_samples)
    altitude = rng.uniform(500, 5000, size=n_samples)

    # Simplified dew point approximation (not meteorologically perfect, but correlated)
    dew_point = temperature - (100 - humidity) / 5.0

    df = pd.DataFrame(
        {
            "temperature": temperature,
            "humidity": humidity,
            "atmospheric_pressure": atmospheric_pressure,
            "wind_speed": wind_speed,
            "rainfall_last_24h": rainfall_last_24h,
            "cloud_cover": cloud_cover,
            "dew_point": dew_point,
            "altitude": altitude,
        }
    )

    # Cloud burst probability logic (higher under extreme conditions)
    high_humidity = humidity > 85
    heavy_rainfall = rainfall_last_24h > 100
    low_pressure = atmospheric_pressure < 1000
    high_cloud_cover = cloud_cover > 80

    base_prob = 0.05
    prob = np.full(n_samples, base_prob)

    # Increment probability based on conditions
    prob += 0.3 * high_humidity
    prob += 0.25 * heavy_rainfall
    prob += 0.2 * low_pressure
    prob += 0.2 * high_cloud_cover

    # Combine conditions for very high risk situations
    extreme_condition = high_humidity & heavy_rainfall & low_pressure & high_cloud_cover
    prob[extreme_condition] = np.clip(prob[extreme_condition] + 0.2, 0, 0.99)

    # Clip probabilities between 0 and 0.99
    prob = np.clip(prob, 0, 0.99)

    labels = rng.binomial(1, prob, size=n_samples)

    # Create a continuous risk score correlated with the probability / severity
    risk_score = prob * 100 + rng.normal(0, 5, size=n_samples)
    risk_score = np.clip(risk_score, 0, 100)

    df["cloud_burst"] = labels
    df["risk_score"] = risk_score
    return df


def train_classifiers(X: pd.DataFrame, y: pd.Series, random_state: int = 42):
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=random_state,
        n_jobs=-1,
    )

    gb = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=3,
        random_state=random_state,
    )

    models = {
        "RandomForestClassifier": rf,
        "GradientBoostingClassifier": gb,
    }

    results = {}
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X, y)
        cv_scores = cross_val_score(model, X, y, cv=5, scoring="f1")
        results[name] = {
            "model": model,
            "cv_mean_f1": float(cv_scores.mean()),
            "cv_std_f1": float(cv_scores.std()),
        }
        print(f"{name} 5-fold F1: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    return results


def train_regressor(X: pd.DataFrame, y: pd.Series, random_state: int = 42):
    # Use a reasonably strong non-linear regressor
    reg = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=3,
        random_state=random_state,
    )
    print("\nTraining GradientBoostingRegressor for risk_score...")
    reg.fit(X, y)
    return reg


def main():
    print("Generating synthetic data...")
    df = generate_synthetic_data(n_samples=10_000)

    feature_cols = [
        "temperature",
        "humidity",
        "atmospheric_pressure",
        "wind_speed",
        "rainfall_last_24h",
        "cloud_cover",
        "dew_point",
        "altitude",
    ]

    X = df[feature_cols]
    y_class = df["cloud_burst"]
    y_reg = df["risk_score"]

    # Train / test split for evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_class, test_size=0.2, random_state=42, stratify=y_class
    )

    print("\nTraining classification models and running cross-validation...")
    clf_results = train_classifiers(X_train, y_train)

    # Pick the best classifier by CV mean F1
    best_name, best_info = max(clf_results.items(), key=lambda item: item[1]["cv_mean_f1"])
    best_clf = best_info["model"]

    print(f"\nBest classifier: {best_name} (F1={best_info['cv_mean_f1']:.4f})")

    # Evaluate on held-out test set
    y_pred = best_clf.predict(X_test)
    print("\nClassification report on test set:")
    print(classification_report(y_test, y_pred, digits=4))

    # Feature importances (if available)
    if hasattr(best_clf, "feature_importances_"):
        importances = best_clf.feature_importances_
        print("\nFeature importances:")
        for name, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True):
            print(f"{name:25s}: {imp:.4f}")
    else:
        print("\nSelected classifier does not provide feature_importances_.")

    # Train regression model for risk_score on full dataset
    reg = train_regressor(X, y_reg)

    # Persist models
    model_path = HERE / "model.pkl"
    risk_model_path = HERE / "risk_model.pkl"

    os.makedirs(HERE, exist_ok=True)
    joblib.dump({"model": best_clf, "features": feature_cols}, model_path)
    joblib.dump({"model": reg, "features": feature_cols}, risk_model_path)

    print(f"\nSaved best classifier to: {model_path}")
    print(f"Saved risk regressor to: {risk_model_path}")


if __name__ == "__main__":
    main()

