from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from backend.app.models.infrastructure import Infrastructure
from backend.app.schemas.infrastructure import InfrastructureCreate, InfrastructureUpdate
from backend.app.repositories.base import BaseRepository


class InfrastructureRepository(BaseRepository[Infrastructure, InfrastructureCreate, InfrastructureUpdate]):
    def get_by_name(self, db: Session, name: str) -> Optional[Infrastructure]:
        """Fetch infrastructure asset by unique name."""
        return db.query(Infrastructure).filter(Infrastructure.name == name).first()

    def get_by_type(
        self, db: Session, *, infrastructure_type: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[Infrastructure]:
        """Retrieve assets filtered by type (e.g. bridge, overpass, dam)."""
        query = db.query(Infrastructure)
        if infrastructure_type:
            query = query.filter(Infrastructure.infrastructure_type == infrastructure_type.lower())
        return query.offset(skip).limit(limit).all()

    def get_with_relations(self, db: Session, id: int) -> Optional[Infrastructure]:
        """Fetch asset with pre-joined defect and prediction relationships."""
        return (
            db.query(Infrastructure)
            .options(
                joinedload(Infrastructure.defects),
                joinedload(Infrastructure.predictions),
                joinedload(Infrastructure.alerts),
            )
            .filter(Infrastructure.id == id)
            .first()
        )


infrastructure_repo = InfrastructureRepository(Infrastructure)
