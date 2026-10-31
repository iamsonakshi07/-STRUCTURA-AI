from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InspectionPriority(str, Enum):
    ROUTINE = "ROUTINE"
    MONITOR = "MONITOR"
    URGENT = "URGENT"
    IMMEDIATE_ACTION = "IMMEDIATE_ACTION"


class RiskScoreBreakdown(BaseModel):
    vision_score: float = Field(..., description="Vision defect health component (0-100)")
    sensor_score: float = Field(..., description="Sensor vibration health component (0-100)")
    rul_score: float = Field(..., description="RUL component health score (0-100)")
    age_score: float = Field(..., description="Structural age endurance score (0-100)")
    weights: Dict[str, float]


class InfrastructureRiskAssessment(BaseModel):
    infrastructure_id: int
    infrastructure_name: str
    infrastructure_type: str
    location: str
    latitude: float
    longitude: float
    overall_health_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: RiskLevel
    inspection_priority: InspectionPriority
    risk_explanation: str
    recommended_action: str
    score_breakdown: RiskScoreBreakdown
    active_defects_count: int
    recent_anomalies_count: int
    estimated_rul_years: Optional[float]
    assessed_at: datetime
    engineering_disclaimer: str

    model_config = {"from_attributes": True}


class PortfolioRiskSummary(BaseModel):
    total_assets: int
    average_health_score: float
    low_risk_count: int
    moderate_risk_count: int
    high_risk_count: int
    critical_risk_count: int
    assets_requiring_inspection: int
    generated_at: datetime
