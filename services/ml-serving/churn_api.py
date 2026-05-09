"""Load churn model artifact (joblib) and expose JSON scoring API."""

from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
DEFAULT_ARTIFACT = ARTIFACT_DIR / "churn_v1.joblib"


def _route_prefix() -> str:
    """Path prefix when mounted behind Vercel Services (full URL path reaches the app)."""
    explicit = os.environ.get("ML_SERVING_ROUTE_PREFIX")
    if explicit is not None:
        return explicit.strip()
    if os.environ.get("VERCEL"):
        return "/_/ml-serving"
    return ""


service = FastAPI(title="HR ERP ML Serving", version="0.1.0")

_PIPELINE = None
FEATURE_ORDER: list[str] = []


def load_model():
    global _PIPELINE, FEATURE_ORDER
    path = Path(os.environ.get("CHURN_MODEL_PATH", DEFAULT_ARTIFACT))
    if not path.is_file():
        raise FileNotFoundError(f"Missing model artifact: {path}")
    bundle = joblib.load(path)
    _PIPELINE = bundle["pipeline"]
    FEATURE_ORDER = list(bundle["feature_order"])


@service.on_event("startup")
def _startup():
    try:
        load_model()
    except FileNotFoundError:
        # Allow health check before training pipeline runs
        pass


class ChurnScoreIn(BaseModel):
    features: dict[str, float] = Field(..., description="Named feature bundle")


@service.get("/health")
def health():
    ok = _PIPELINE is not None
    return {"status": "ok" if ok else "no_model", "features": FEATURE_ORDER}


@service.post("/v1/churn/score")
def churn_score(body: ChurnScoreIn):
    if _PIPELINE is None:
        raise HTTPException(503, "model not loaded; run training pipeline")
    vec = []
    for name in FEATURE_ORDER:
        if name not in body.features:
            raise HTTPException(400, f"missing feature: {name}")
        vec.append(float(body.features[name]))
    x = np.asarray([vec], dtype=np.float32)
    proba = float(_PIPELINE.predict_proba(x)[0, 1])
    # Toy explanations: rank |coef * x| for linear models inside pipeline
    explain: list[dict] = []
    try:
        clf = _PIPELINE.named_steps.get("clf")
        if clf is not None and hasattr(clf, "coef_"):
            coef = clf.coef_.ravel()
            for i, name in enumerate(FEATURE_ORDER):
                explain.append({"feature": name, "contribution": float(coef[i] * vec[i])})
            explain.sort(key=lambda d: abs(d["contribution"]), reverse=True)
            explain = explain[:5]
    except Exception:
        explain = []
    return {"flight_risk": proba, "model": "churn_v1_logreg", "drivers": explain}


def _build_app() -> FastAPI:
    """ASGI app exposed as `app` for uvicorn and Vercel (expects a top-level `app` binding)."""
    prefix = _route_prefix()
    if not prefix:
        return service
    root = FastAPI()
    root.mount(prefix.rstrip("/"), service)
    return root


# Single top-level assignment so deployment tooling can detect the ASGI app without executing branches.
app = _build_app()
# Alias some runtimes look for (e.g. Gunicorn-style `application`).
application = app
