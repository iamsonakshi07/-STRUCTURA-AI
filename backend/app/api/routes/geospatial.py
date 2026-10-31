from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.geospatial import (
    GeoJSONFeatureCollection,
    InfrastructureGeoProperties,
    DefectGeoProperties,
    HeatmapResponse,
)
from backend.app.schemas.common import APIResponse, response_success
from backend.app.services.geospatial.service import geospatial_service

router = APIRouter(prefix="/geo", tags=["Geospatial API"])


@router.get("/infrastructure", response_model=APIResponse[GeoJSONFeatureCollection[InfrastructureGeoProperties]])
def get_infrastructure_geojson(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all monitored bridges, dams, and overpasses as an RFC 7946 GeoJSON FeatureCollection.
    Features include health scores, risk levels, and frontend map marker styling (colors and radius).
    """
    geojson = geospatial_service.get_infrastructure_features(db)
    return response_success(
        data=geojson.model_dump(),
        message="Infrastructure GeoJSON features retrieved successfully",
    )


@router.get("/defects", response_model=APIResponse[GeoJSONFeatureCollection[DefectGeoProperties]])
def get_defects_geojson(
    infrastructure_id: Optional[int] = Query(None, description="Filter by infrastructure asset ID"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MODERATE, HIGH, CRITICAL"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve geo-located structural defects (cracks, corrosion, rebar exposure) as a GeoJSON FeatureCollection.
    Ideal for GIS map layers and drone flyover overlay plotting.
    """
    geojson = geospatial_service.get_defect_features(
        db, infrastructure_id=infrastructure_id, severity=severity
    )
    return response_success(
        data=geojson.model_dump(),
        message=f"Retrieved {len(geojson.features)} defect GeoJSON features",
    )


@router.get("/heatmap", response_model=APIResponse[HeatmapResponse])
def get_structural_risk_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve coordinate and intensity points formatted for frontend GIS heatmaps.
    Fuses defect severity clusters and high-risk structural asset coordinates with bounding box.
    """
    heatmap_data = geospatial_service.get_heatmap_points(db)
    return response_success(
        data=heatmap_data.model_dump(),
        message=f"Retrieved {heatmap_data.total_points} heatmap data points",
    )
