from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.risk import (
    InfrastructureRiskAssessment,
    PortfolioRiskSummary,
)
from backend.app.schemas.common import APIResponse, response_success
from backend.app.services.risk.engine import risk_engine

router = APIRouter(prefix="/risk", tags=["Risk Assessment Engine"])


@router.get("/summary", response_model=APIResponse[PortfolioRiskSummary])
def get_risk_portfolio_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get portfolio-wide structural risk summary.
    Aggregates overall health scores, risk levels (LOW, MODERATE, HIGH, CRITICAL),
    and counts of assets requiring immediate engineering intervention.
    """
    summary = risk_engine.get_portfolio_summary(db)
    return response_success(
        data=summary.model_dump(),
        message="Portfolio risk summary calculated successfully",
    )


@router.get("/critical", response_model=APIResponse[List[InfrastructureRiskAssessment]])
def get_critical_risk_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve infrastructure assets classified as HIGH or CRITICAL risk.
    Sorted by urgency to prioritize dispatching emergency engineering crews.
    """
    critical_assets = risk_engine.get_critical_assets(db)
    data = [c.model_dump() for c in critical_assets]
    return response_success(
        data=data,
        message=f"Retrieved {len(data)} high/critical risk infrastructure assets",
    )


@router.get("/{infrastructure_id}", response_model=APIResponse[InfrastructureRiskAssessment])
def get_infrastructure_risk_assessment(
    infrastructure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate an in-depth multimodal risk assessment for a specific infrastructure asset.
    Combines computer vision defect detection, IoT vibration analytics, structural age,
    and RUL forecasts into a unified 0-100 health score with actionable recommendations.
    """
    assessment = risk_engine.assess_infrastructure(db, infrastructure_id)
    return response_success(
        data=assessment.model_dump(),
        message=f"Risk assessment for {assessment.infrastructure_name} completed successfully",
    )
