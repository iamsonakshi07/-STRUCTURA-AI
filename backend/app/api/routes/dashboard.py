from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, require_roles
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.alert import Alert
from backend.app.schemas.dashboard import (
    DashboardOverviewResponse,
    DashboardAnalyticsResponse,
    DashboardAlertsResponse,
    DashboardInfrastructureItem,
    DashboardAlertItem,
)
from backend.app.schemas.common import APIResponse, response_success
from backend.app.services.dashboard.service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard Integration"])


@router.get("/overview", response_model=APIResponse[DashboardOverviewResponse])
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve aggregated dashboard overview cards for the React frontend:
    Total infrastructure, detected defects, critical risks, average health score,
    active alerts count, and recent priority alerts.
    """
    overview = dashboard_service.get_overview(db)
    return response_success(
        data=overview.model_dump(),
        message="Dashboard overview metrics retrieved successfully",
    )


@router.get("/analytics", response_model=APIResponse[DashboardAnalyticsResponse])
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve deep analytics datasets:
    Defect category breakdown (cracks, corrosion, exposed rebar), severity distributions,
    24h IoT vibration sensor activity, and asset type distributions.
    """
    analytics = dashboard_service.get_analytics(db)
    return response_success(
        data=analytics.model_dump(),
        message="Dashboard analytics datasets retrieved successfully",
    )


@router.get("/alerts", response_model=APIResponse[DashboardAlertsResponse])
def get_dashboard_alerts(
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE, ACKNOWLEDGED, RESOLVED"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MODERATE, HIGH, CRITICAL"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full alerts feed with active, acknowledged, and resolved status filters."""
    alerts_data = dashboard_service.get_alerts(
        db, status_filter=status, severity_filter=severity, limit=limit
    )
    return response_success(
        data=alerts_data.model_dump(),
        message=f"Retrieved {len(alerts_data.alerts)} alert records",
    )


@router.get("/infrastructure", response_model=APIResponse[List[DashboardInfrastructureItem]])
def get_dashboard_infrastructure_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all monitored infrastructure assets with live health scores, risk levels, and defect tallies."""
    infra_table = dashboard_service.get_infrastructure_table(db)
    data = [item.model_dump() for item in infra_table]
    return response_success(
        data=data,
        message=f"Retrieved {len(data)} infrastructure assets for dashboard view",
    )


@router.put("/alerts/{alert_id}/status", response_model=APIResponse[DashboardAlertItem])
def update_alert_status(
    alert_id: int,
    new_status: str = Query(..., pattern="^(ACKNOWLEDGED|RESOLVED|ACTIVE)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """Acknowledge or resolve an active alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with id {alert_id} not found",
        )

    alert.status = new_status.upper()
    db.commit()
    db.refresh(alert)

    item = DashboardAlertItem(
        id=alert.id,
        infrastructure_id=alert.infrastructure_id,
        infrastructure_name=alert.infrastructure.name,
        alert_type=alert.alert_type,
        severity=alert.severity,
        message=alert.message,
        status=alert.status,
        created_at=alert.created_at,
    )
    return response_success(
        data=item.model_dump(),
        message=f"Alert status updated to {new_status}",
    )
