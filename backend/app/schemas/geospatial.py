from datetime import datetime
from typing import List, Dict, Any, Optional, Generic, TypeVar, Union
from pydantic import BaseModel, Field

PropT = TypeVar("PropT")


class GeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float] = Field(
        ..., description="GeoJSON RFC 7946 coordinate array: [longitude, latitude]"
    )


class GeoJSONFeature(BaseModel, Generic[PropT]):
    type: str = "Feature"
    id: Optional[Union[str, int]] = None
    geometry: GeoJSONGeometry
    properties: PropT


class GeoJSONFeatureCollection(BaseModel, Generic[PropT]):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature[PropT]]
    metadata: Optional[Dict[str, Any]] = None


class InfrastructureGeoProperties(BaseModel):
    id: int
    name: str
    infrastructure_type: str
    location: str
    construction_year: int
    material_type: str
    health_score: float
    risk_level: str
    inspection_priority: str
    active_defects_count: int
    marker_color: str
    marker_radius: int


class DefectGeoProperties(BaseModel):
    id: int
    infrastructure_id: int
    infrastructure_name: str
    defect_type: str
    severity: str
    confidence: float
    detected_at: datetime
    image_path: str
    processed_image_path: Optional[str] = None
    marker_color: str


class HeatmapPoint(BaseModel):
    latitude: float
    longitude: float
    intensity: float = Field(..., ge=0.0, le=1.0, description="Normalized risk / severity weight [0.0 - 1.0]")
    weight: float = Field(..., description="Absolute weight multiplier for heatmap density")
    category: str = Field(..., description="defect or infrastructure")
    source_type: str
    source_id: int


class HeatmapResponse(BaseModel):
    points: List[HeatmapPoint]
    total_points: int
    bounds: Dict[str, float]
    generated_at: datetime
