from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    infrastructure_type = Column(String(50), nullable=False, index=True)  # bridge, dam, overpass, tunnel
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    construction_year = Column(Integer, nullable=False)
    material_type = Column(String(100), nullable=False)  # reinforced_concrete, steel, prestressed_concrete, masonry
    inspection_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships with cascade delete
    defects = relationship("Defect", back_populates="infrastructure", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="infrastructure", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="infrastructure", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="infrastructure", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Infrastructure id={self.id} name='{self.name}' type='{self.infrastructure_type}'>"
