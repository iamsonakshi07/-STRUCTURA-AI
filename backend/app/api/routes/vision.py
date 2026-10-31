from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, require_roles
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.defect import Defect
from backend.app.models.infrastructure import Infrastructure
from backend.app.schemas.vision import VisionAnalysisResponse, DefectDetailResponse
from backend.app.schemas.common import APIResponse, response_success
from backend.app.services.vision.service import vision_service

router = APIRouter(prefix="/vision", tags=["Computer Vision AI"])


@router.post("/analyze", response_model=APIResponse[VisionAnalysisResponse], status_code=status.HTTP_201_CREATED)
async def analyze_infrastructure_image(
    infrastructure_id: int = Form(..., description="ID of the infrastructure asset being inspected"),
    file: UploadFile = File(..., description="Inspection image (JPG, JPEG, or PNG)"),
    latitude: Optional[float] = Form(None, description="Optional geo-tagged latitude"),
    longitude: Optional[float] = Form(None, description="Optional geo-tagged longitude"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """
    Upload and analyze drone / camera imagery of concrete bridges, dams, or overpasses.
    Detects cracks, corrosion, and exposed reinforcement using YOLOv8 / OpenCV vision pipeline.
    """
    result = await vision_service.analyze_and_record(
        db=db,
        infrastructure_id=infrastructure_id,
        file=file,
        latitude=latitude,
        longitude=longitude,
    )
    return response_success(data=result.model_dump(), message="Image analysis completed successfully")


@router.get("/results/{id}", response_model=APIResponse[DefectDetailResponse])
def get_defect_result(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve defect detection record by ID."""
    defect = db.query(Defect).filter(Defect.id == id).first()
    if not defect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Defect record with id {id} not found",
        )
    data = DefectDetailResponse.model_validate(defect)
    return response_success(data=data.model_dump(), message="Defect record retrieved successfully")


@router.get("/infrastructure/{infrastructure_id}", response_model=APIResponse[List[DefectDetailResponse]])
def get_defects_by_infrastructure(
    infrastructure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all visual defect records for a specific infrastructure asset."""
    infra = db.query(Infrastructure).filter(Infrastructure.id == infrastructure_id).first()
    if not infra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infrastructure asset with id {infrastructure_id} not found",
        )

    defects = (
        db.query(Defect)
        .filter(Defect.infrastructure_id == infrastructure_id)
        .order_by(Defect.detected_at.desc())
        .all()
    )
    data = [DefectDetailResponse.model_validate(d).model_dump() for d in defects]
    return response_success(
        data=data,
        message=f"Retrieved {len(data)} defect records for infrastructure {infra.name}",
    )
