from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InfrastructureBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, json_schema_extra={"example": "Golden Gateway Bridge"})
    infrastructure_type: str = Field(..., min_length=2, max_length=50, json_schema_extra={"example": "bridge"})
    location: str = Field(..., min_length=2, max_length=255, json_schema_extra={"example": "San Francisco, CA"})
    latitude: float = Field(..., ge=-90.0, le=90.0, json_schema_extra={"example": 37.8199})
    longitude: float = Field(..., ge=-180.0, le=180.0, json_schema_extra={"example": -122.4783})
    construction_year: int = Field(..., ge=1800, le=2100, json_schema_extra={"example": 1937})
    material_type: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "steel"})
    inspection_date: Optional[datetime] = None


class InfrastructureCreate(InfrastructureBase):
    pass


class InfrastructureUpdate(BaseModel):
    name: Optional[str] = None
    infrastructure_type: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    construction_year: Optional[int] = Field(None, ge=1800, le=2100)
    material_type: Optional[str] = None
    inspection_date: Optional[datetime] = None


class InfrastructureResponse(InfrastructureBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InfrastructureDetailResponse(InfrastructureResponse):
    defects_count: int = 0
    sensor_readings_count: int = 0
    active_alerts_count: int = 0
    latest_health_score: Optional[float] = 100.0
    latest_risk_level: Optional[str] = "LOW"
