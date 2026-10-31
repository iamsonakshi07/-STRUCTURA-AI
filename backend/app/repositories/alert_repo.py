from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.alert import Alert
from backend.app.repositories.base import BaseRepository


class AlertRepository(BaseRepository[Alert, dict, dict]):
    def get_active_alerts(self, db: Session, *, limit: int = 50) -> List[Alert]:
        """Fetch active infrastructure alerts ordered by timestamp."""
        return (
            db.query(Alert)
            .filter(Alert.status == "ACTIVE")
            .order_by(desc(Alert.created_at))
            .limit(limit)
            .all()
        )

    def get_by_infrastructure(
        self, db: Session, infrastructure_id: int, *, limit: int = 50
    ) -> List[Alert]:
        """Fetch alerts associated with a specific asset."""
        return (
            db.query(Alert)
            .filter(Alert.infrastructure_id == infrastructure_id)
            .order_by(desc(Alert.created_at))
            .limit(limit)
            .all()
        )

    def count_active(self, db: Session) -> int:
        """Count active alerts."""
        return db.query(Alert).filter(Alert.status == "ACTIVE").count()

    def update_status(self, db: Session, alert_id: int, status: str) -> Optional[Alert]:
        """Update lifecycle status of an alert (ACTIVE, ACKNOWLEDGED, RESOLVED)."""
        alert = self.get(db, alert_id)
        if alert:
            alert.status = status.upper()
            db.add(alert)
            db.commit()
            db.refresh(alert)
        return alert


alert_repo = AlertRepository(Alert)
