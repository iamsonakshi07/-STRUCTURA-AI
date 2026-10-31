from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    infrastructure_id = Column(Integer, ForeignKey("infrastructure.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False, index=True)  # DEFECT_DETECTED, SENSOR_ANOMALY, RUL_CRITICAL, HIGH_RISK
    severity = Column(String(20), nullable=False, index=True)    # LOW, MODERATE, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    status = Column(String(20), default="ACTIVE", nullable=False, index=True)  # ACTIVE, ACKNOWLEDGED, RESOLVED

    # Relationships
    infrastructure = relationship("Infrastructure", back_populates="alerts")

    def __repr__(self) -> str:
        return f"<Alert id={self.id} type='{self.alert_type}' severity='{self.severity}' status='{self.status}'>"
