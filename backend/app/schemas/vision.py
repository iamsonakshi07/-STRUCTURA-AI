from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: int = Field(..., description="Top-left X coordinate")
    y1: int = Field(..., description="Top-left Y coordinate")
    x2: int = Field(..., description="Bottom-right X coordinate")
    y2: int = Field(..., description="Bottom-right Y coordinate")


class DefectDetectionItem(BaseModel):
    id: Optional[int] = None
    defect_type: str = Field(..., description="crack, corrosion, exposed_reinforcement, spalling")
    severity: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    confidence: float = Field(..., ge=0.0, le=1.0)
    bounding_box: BoundingBox
    is_simulated: bool = Field(False, description="Flag indicating if detection is from demo prototype or trained model")


class VisionAnalysisResponse(BaseModel):
    infrastructure_id: int
    image_filename: str
    original_image_path: str
    processed_image_path: str
    image_width: int
    image_height: int
    defects_detected_count: int
    defects: List[DefectDetectionItem]
    detection_engine: str
    is_simulated_mode: bool
    analyzed_at: datetime


class DefectDetailResponse(BaseModel):
    id: int
    infrastructure_id: int
    defect_type: str
    severity: str
    confidence: float
    image_path: str
    processed_image_path: Optional[str] = None
    bounding_box: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    detected_at: datetime

    model_config = {"from_attributes": True}
