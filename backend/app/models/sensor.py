from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    infrastructure_id = Column(Integer, ForeignKey("infrastructure.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(String(50), nullable=False, index=True)
    vibration = Column(Float, nullable=False)       # RMS vibration velocity (mm/s)
    acceleration = Column(Float, nullable=False)    # Acceleration (m/s^2)
    frequency = Column(Float, nullable=False)       # Dominant frequency (Hz)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    is_anomaly = Column(Boolean, default=False, nullable=False, index=True)
    anomaly_score = Column(Float, default=0.0, nullable=False)

    # Relationships
    infrastructure = relationship("Infrastructure", back_populates="sensor_readings")

    def __repr__(self) -> str:
        return f"<SensorReading id={self.id} sensor='{self.sensor_id}' vib={self.vibration:.2f} anomaly={self.is_anomaly}>"
