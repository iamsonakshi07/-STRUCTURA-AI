from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    infrastructure_id = Column(Integer, ForeignKey("infrastructure.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id = Column(String(100), nullable=False, default="overall_structure")
    predicted_rul = Column(Float, nullable=False)     # Remaining Useful Life in years
    risk_level = Column(String(20), nullable=False)   # LOW, MODERATE, HIGH, CRITICAL
    confidence = Column(Float, nullable=False)        # Model certainty score (0.0 - 1.0)
    health_score = Column(Float, nullable=False, default=100.0)  # 0.0 - 100.0 scale
    factors = Column(Text, nullable=True)             # JSON string of contributing features
    prediction_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    infrastructure = relationship("Infrastructure", back_populates="predictions")

    def __repr__(self) -> str:
        return f"<Prediction id={self.id} rul={self.predicted_rul:.1f}y risk='{self.risk_level}'>"
