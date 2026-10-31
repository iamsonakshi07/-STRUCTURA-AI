from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, require_roles
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.prediction import (
    RULPredictionRequest,
    RULPredictionResponse,
)
from backend.app.schemas.common import APIResponse, response_success
from backend.app.services.prediction.service import prediction_service

router = APIRouter(prefix="/prediction", tags=["Remaining Useful Life (RUL) Prediction"])


@router.post("/rul", response_model=APIResponse[RULPredictionResponse], status_code=status.HTTP_201_CREATED)
def calculate_rul_prediction(
    req: RULPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """
    Generate an ML-based Remaining Useful Life (RUL) prediction and structural health score.
    Fuses structural age, material degradation, visual defect penalties, dynamic vibration telemetry,
    and environmental condition factors.
    """
    result = prediction_service.calculate_and_record_rul(db, req)
    return response_success(
        data=result.model_dump(),
        message="Remaining Useful Life prediction calculated successfully",
    )


@router.get("/{infrastructure_id}", response_model=APIResponse[RULPredictionResponse])
def get_latest_rul_prediction(
    infrastructure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the latest Remaining Useful Life (RUL) prediction for an infrastructure asset."""
    result = prediction_service.get_latest_prediction(db, infrastructure_id)
    return response_success(
        data=result.model_dump(),
        message="Latest RUL prediction retrieved successfully",
    )


@router.get("/history/{infrastructure_id}", response_model=APIResponse[List[RULPredictionResponse]])
def get_rul_prediction_history(
    infrastructure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve historical RUL prediction log and degradation trends for an asset."""
    history = prediction_service.get_prediction_history(db, infrastructure_id)
    data = [h.model_dump() for h in history]
    return response_success(
        data=data,
        message=f"Retrieved {len(data)} historical predictions",
    )
