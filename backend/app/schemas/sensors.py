from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class SensorReadingBase(BaseModel):
    sensor_id: str = Field(..., min_length=2, max_length=50, json_schema_extra={"example": "ACCEL-PIER-01"})
    vibration: float = Field(..., description="Vibration velocity RMS or amplitude in mm/s", json_schema_extra={"example": 2.45})
    acceleration: float = Field(..., description="Acceleration amplitude in m/s^2", json_schema_extra={"example": 0.58})
    frequency: float = Field(..., ge=0.0, description="Dominant frequency in Hz", json_schema_extra={"example": 8.5})
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))


class SensorReadingCreate(SensorReadingBase):
    infrastructure_id: int = Field(..., description="Target infrastructure asset ID")


class SensorBatchItem(BaseModel):
    sensor_id: str
    vibration: float
    acceleration: float
    frequency: float
    timestamp: Optional[datetime] = None


class SensorBatchCreate(BaseModel):
    infrastructure_id: int
    readings: List[SensorBatchItem] = Field(..., min_length=1, max_length=5000)


class SensorReadingResponse(SensorReadingBase):
    id: int
    infrastructure_id: int
    is_anomaly: bool
    anomaly_score: float

    model_config = {"from_attributes": True}


class SensorStatisticalSummary(BaseModel):
    total_samples: int
    anomaly_count: int
    vibration_mean: float
    vibration_std: float
    vibration_rms: float
    vibration_peak: float
    crest_factor: float
    dominant_frequency_mean: float


class SensorBatchResponse(BaseModel):
    infrastructure_id: int
    summary: SensorStatisticalSummary
    saved_count: int
    anomalies_detected: int
    readings: List[SensorReadingResponse]


class SensorSimulateRequest(BaseModel):
    infrastructure_id: int
    sensor_id: str = "VIB-PIER-01"
    num_samples: int = Field(default=50, ge=5, le=500)
    inject_anomalies: bool = True
    anomaly_ratio: float = Field(default=0.10, ge=0.0, le=0.5)
