from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.defect import Defect
from backend.app.schemas.vision import DefectDetectionItem
from backend.app.repositories.base import BaseRepository


class DefectRepository(BaseRepository[Defect, DefectDetectionItem, DefectDetectionItem]):
    def get_by_infrastructure(
        self, db: Session, infrastructure_id: int, *, skip: int = 0, limit: int = 100
    ) -> List[Defect]:
        """Fetch all defects logged for an infrastructure asset."""
        return (
            db.query(Defect)
            .filter(Defect.infrastructure_id == infrastructure_id)
            .order_by(Defect.detected_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_severity(self, db: Session, severity: str) -> List[Defect]:
        """Fetch defects matching a severity level (LOW, MODERATE, HIGH, CRITICAL)."""
        return db.query(Defect).filter(Defect.severity == severity.upper()).all()

    def get_by_category(self, db: Session, category: str) -> List[Defect]:
        """Fetch defects matching category name (crack, corrosion, rebar_exposure, foundation_shift)."""
        return db.query(Defect).filter(Defect.defect_type == category.lower()).all()

    def count_by_infrastructure(self, db: Session, infrastructure_id: int) -> int:
        """Count defects associated with an asset."""
        return (
            db.query(func.count(Defect.id))
            .filter(Defect.infrastructure_id == infrastructure_id)
            .scalar()
            or 0
        )


defect_repo = DefectRepository(Defect)
