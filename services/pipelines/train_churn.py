"""Train a calibrated logistic regression churn model and write joblib artifact for ml-serving."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "ml-serving" / "artifacts" / "churn_v1.joblib"
META = ROOT / "ml-serving" / "artifacts" / "churn_v1_features.json"

FEATURE_ORDER = [
    "tenure_months",
    "pto_hours_remaining",
    "pto_requests_90d",
    "comp_band_position",
    "review_sentiment",
    "market_comp_ratio",
]


def _synth_rows(n: int = 800, seed: int = 42):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, len(FEATURE_ORDER)))
    # voluntary churn more likely when market ratio low, sentiment low, many PTO requests
    logit = (
        -0.9
        - 0.8 * X[:, 5]
        - 0.6 * X[:, 4]
        + 0.5 * X[:, 2]
        + 0.1 * X[:, 0]
        + rng.normal(scale=0.4, size=n)
    )
    p = 1 / (1 + np.exp(-logit))
    y = (rng.random(n) < p).astype(np.int32)
    return X, y


def main():
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    X, y = _synth_rows()
    clf = LogisticRegression(max_iter=200, class_weight="balanced")
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", clf)])
    pipe.fit(X, y)
    bundle = {"pipeline": pipe, "feature_order": FEATURE_ORDER}
    joblib.dump(bundle, ARTIFACT)
    META.write_text(json.dumps({"feature_order": FEATURE_ORDER}, indent=2), encoding="utf-8")
    print("wrote", ARTIFACT)


if __name__ == "__main__":
    main()
