from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    infrastructure_id = Column(Integer, ForeignKey("infrastructure.id", ondelete="CASCADE"), nullable=False, index=True)
    defect_type = Column(String(50), nullable=False, index=True)  # crack, corrosion, exposed_reinforcement, spalling
    severity = Column(String(20), nullable=False, index=True)      # LOW, MODERATE, HIGH, CRITICAL
    confidence = Column(Float, nullable=False)                     # 0.0 to 1.0
    image_path = Column(String(500), nullable=False)
    processed_image_path = Column(String(500), nullable=True)
    bounding_box = Column(Text, nullable=True)                     # JSON string: {"x1": 10, "y1": 20, "x2": 100, "y2": 150}
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    infrastructure = relationship("Infrastructure", back_populates="defects")

    def __repr__(self) -> str:
        return f"<Defect id={self.id} type='{self.defect_type}' severity='{self.severity}' confidence={self.confidence:.2f}>"
