from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.prediction import Prediction
from backend.app.repositories.base import BaseRepository


class PredictionRepository(BaseRepository[Prediction, dict, dict]):
    def get_latest_by_infrastructure(
        self, db: Session, infrastructure_id: int
    ) -> Optional[Prediction]:
        """Fetch the most recent RUL prediction for an infrastructure asset."""
        return (
            db.query(Prediction)
            .filter(Prediction.infrastructure_id == infrastructure_id)
            .order_by(desc(Prediction.prediction_date))
            .first()
        )

    def get_history(
        self, db: Session, infrastructure_id: int, *, limit: int = 20
    ) -> List[Prediction]:
        """Fetch chronological prediction history for an infrastructure asset."""
        return (
            db.query(Prediction)
            .filter(Prediction.infrastructure_id == infrastructure_id)
            .order_by(desc(Prediction.prediction_date))
            .limit(limit)
            .all()
        )


prediction_repo = PredictionRepository(Prediction)
