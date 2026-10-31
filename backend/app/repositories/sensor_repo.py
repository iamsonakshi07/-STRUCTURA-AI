from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.sensor import SensorReading
from backend.app.schemas.sensors import SensorBatchItem
from backend.app.repositories.base import BaseRepository


class SensorRepository(BaseRepository[SensorReading, SensorBatchItem, SensorBatchItem]):
    def get_telemetry(
        self,
        db: Session,
        infrastructure_id: int,
        *,
        limit: int = 100,
        since: Optional[datetime] = None,
    ) -> List[SensorReading]:
        """Fetch IoT sensor readings for an infrastructure asset."""
        query = (
            db.query(SensorReading)
            .filter(SensorReading.infrastructure_id == infrastructure_id)
        )
        if since:
            query = query.filter(SensorReading.timestamp >= since)
        return query.order_by(desc(SensorReading.timestamp)).limit(limit).all()

    def get_anomalies(
        self, db: Session, infrastructure_id: int, *, limit: int = 50
    ) -> List[SensorReading]:
        """Fetch anomalous sensor readings."""
        return (
            db.query(SensorReading)
            .filter(
                SensorReading.infrastructure_id == infrastructure_id,
                SensorReading.is_anomaly == True,  # noqa: E712
            )
            .order_by(desc(SensorReading.timestamp))
            .limit(limit)
            .all()
        )

    def get_latest(self, db: Session, infrastructure_id: int) -> Optional[SensorReading]:
        """Fetch the most recent telemetry sample."""
        return (
            db.query(SensorReading)
            .filter(SensorReading.infrastructure_id == infrastructure_id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )


sensor_repo = SensorRepository(SensorReading)
