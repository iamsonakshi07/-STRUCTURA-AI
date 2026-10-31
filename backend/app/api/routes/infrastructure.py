from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.api.deps import get_current_user, require_roles
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.alert import Alert
from backend.app.models.prediction import Prediction
from backend.app.schemas.infrastructure import (
    InfrastructureCreate,
    InfrastructureUpdate,
    InfrastructureResponse,
    InfrastructureDetailResponse,
)
from backend.app.schemas.common import APIResponse, response_success

router = APIRouter(prefix="/infrastructure", tags=["Infrastructure"])


@router.post("/", response_model=APIResponse[InfrastructureResponse], status_code=status.HTTP_201_CREATED)
def create_infrastructure(
    infra_in: InfrastructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """Register a new infrastructure asset (Bridge, Dam, Overpass, etc.)."""
    infra = Infrastructure(**infra_in.model_dump())
    db.add(infra)
    db.commit()
    db.refresh(infra)
    data = InfrastructureResponse.model_validate(infra)
    return response_success(data=data.model_dump(), message="Infrastructure asset registered successfully")


@router.get("/", response_model=APIResponse[List[InfrastructureResponse]])
def list_infrastructure(
    type: Optional[str] = Query(None, description="Filter by type (e.g. bridge, dam, overpass)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all monitored infrastructure assets."""
    query = db.query(Infrastructure)
    if type:
        query = query.filter(Infrastructure.infrastructure_type == type.lower())
    infras = query.offset(skip).limit(limit).all()
    data = [InfrastructureResponse.model_validate(i).model_dump() for i in infras]
    return response_success(data=data, message=f"Retrieved {len(data)} infrastructure assets")


@router.get("/{id}", response_model=APIResponse[InfrastructureDetailResponse])
def get_infrastructure_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full details of an infrastructure asset including defect count and alerts."""
    infra = db.query(Infrastructure).filter(Infrastructure.id == id).first()
    if not infra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infrastructure asset with id {id} not found",
        )

    defects_count = db.query(func.count(Defect.id)).filter(Defect.infrastructure_id == id).scalar() or 0
    readings_count = db.query(func.count(SensorReading.id)).filter(SensorReading.infrastructure_id == id).scalar() or 0
    alerts_count = (
        db.query(func.count(Alert.id))
        .filter(Alert.infrastructure_id == id, Alert.status == "ACTIVE")
        .scalar()
        or 0
    )

    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.infrastructure_id == id)
        .order_by(Prediction.prediction_date.desc())
        .first()
    )

    detail_data = InfrastructureDetailResponse(
        id=infra.id,
        name=infra.name,
        infrastructure_type=infra.infrastructure_type,
        location=infra.location,
        latitude=infra.latitude,
        longitude=infra.longitude,
        construction_year=infra.construction_year,
        material_type=infra.material_type,
        inspection_date=infra.inspection_date,
        created_at=infra.created_at,
        updated_at=infra.updated_at,
        defects_count=defects_count,
        sensor_readings_count=readings_count,
        active_alerts_count=alerts_count,
        latest_health_score=latest_pred.health_score if latest_pred else 100.0,
        latest_risk_level=latest_pred.risk_level if latest_pred else "LOW",
    )
    return response_success(data=detail_data.model_dump(), message="Infrastructure details retrieved successfully")


@router.put("/{id}", response_model=APIResponse[InfrastructureResponse])
def update_infrastructure(
    id: int,
    update_data: InfrastructureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """Update details of an infrastructure asset."""
    infra = db.query(Infrastructure).filter(Infrastructure.id == id).first()
    if not infra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infrastructure asset with id {id} not found",
        )

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(infra, field, value)

    db.commit()
    db.refresh(infra)
    data = InfrastructureResponse.model_validate(infra)
    return response_success(data=data.model_dump(), message="Infrastructure asset updated successfully")


@router.delete("/{id}", response_model=APIResponse[dict])
def delete_infrastructure(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    """Delete an infrastructure asset and cascade its associated records."""
    infra = db.query(Infrastructure).filter(Infrastructure.id == id).first()
    if not infra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infrastructure asset with id {id} not found",
        )

    db.delete(infra)
    db.commit()
    return response_success(data={"deleted_id": id}, message="Infrastructure asset deleted successfully")
