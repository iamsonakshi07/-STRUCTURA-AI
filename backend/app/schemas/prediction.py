from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class EnvironmentalCondition(str, Enum):
    RURAL = "rural"
    URBAN = "urban"
    INDUSTRIAL = "industrial"
    COASTAL = "coastal"
    MARINE = "marine"


class ContributingFactors(BaseModel):
    structural_age_years: float = Field(..., description="Current age since construction")
    design_life_years: float = Field(..., description="Standard nominal design lifespan for material")
    age_depreciation_pct: float = Field(..., description="Depreciation percentage attributable to age alone")
    defect_severity_impact_pct: float = Field(..., description="Degradation penalty from visual defects")
    vibration_fatigue_impact_pct: float = Field(..., description="Fatigue penalty from dynamic vibration & anomalies")
    environmental_harshness_factor: float = Field(..., description="Environmental acceleration factor (1.0 = baseline)")
    cyclic_stress_factor: float = Field(..., description="Traffic / loading cycle stress multiplier")


class RULPredictionRequest(BaseModel):
    infrastructure_id: int
    component_id: Optional[str] = "overall_structure"
    environmental_condition: Optional[EnvironmentalCondition] = EnvironmentalCondition.URBAN
    cyclic_loading_daily_volume: Optional[int] = Field(default=25000, ge=100, le=500000)
    manual_defect_penalty: Optional[float] = Field(None, ge=0.0, le=100.0, description="Optional override for visual defect penalty")
    manual_vibration_rms: Optional[float] = Field(None, ge=0.0, le=50.0, description="Optional override for vibration RMS in mm/s")


class RULPredictionResponse(BaseModel):
    id: Optional[int] = None
    infrastructure_id: int
    component_id: str
    predicted_rul_years: float
    predicted_rul_months: float
    confidence_score: float
    health_score: float
    risk_level: str
    prediction_date: datetime
    contributing_factors: ContributingFactors
    model_metadata: Dict[str, Any]
    safety_disclaimer: str

    model_config = {"from_attributes": True}
