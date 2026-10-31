from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.prediction import Prediction
from backend.app.schemas.geospatial import (
    GeoJSONGeometry,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    InfrastructureGeoProperties,
    DefectGeoProperties,
    HeatmapPoint,
    HeatmapResponse,
)

# Marker styles by risk level
RISK_COLOR_PALETTE = {
    "CRITICAL": {"color": "#EF4444", "radius": 14},  # Red
    "HIGH": {"color": "#F97316", "radius": 12},      # Orange
    "MODERATE": {"color": "#EAB308", "radius": 10},  # Yellow
    "LOW": {"color": "#10B981", "radius": 8},        # Green
}

# Marker styles by defect severity
DEFECT_COLOR_PALETTE = {
    "CRITICAL": "#DC2626",
    "HIGH": "#EA580C",
    "MODERATE": "#CA8A04",
    "LOW": "#16A34A",
}


class GeospatialService:
    def get_infrastructure_features(self, db: Session) -> GeoJSONFeatureCollection[InfrastructureGeoProperties]:
        """Convert all infrastructure assets into standard GeoJSON features with health risk markers."""
        infras = db.query(Infrastructure).all()
        features = []

        for infra in infras:
            # Query defect count
            defect_count = (
                db.query(func.count(Defect.id))
                .filter(Defect.infrastructure_id == infra.id)
                .scalar()
                or 0
            )

            # Query latest prediction
            pred = (
                db.query(Prediction)
                .filter(Prediction.infrastructure_id == infra.id)
                .order_by(Prediction.prediction_date.desc())
                .first()
            )

            health_score = pred.health_score if pred else 85.0
            risk_level = pred.risk_level if pred else "LOW"

            priority = (
                "IMMEDIATE_ACTION" if risk_level == "CRITICAL"
                else "URGENT" if risk_level == "HIGH"
                else "MONITOR" if risk_level == "MODERATE"
                else "ROUTINE"
            )

            style = RISK_COLOR_PALETTE.get(risk_level, {"color": "#10B981", "radius": 8})

            props = InfrastructureGeoProperties(
                id=infra.id,
                name=infra.name,
                infrastructure_type=infra.infrastructure_type,
                location=infra.location,
                construction_year=infra.construction_year,
                material_type=infra.material_type,
                health_score=round(health_score, 1),
                risk_level=risk_level,
                inspection_priority=priority,
                active_defects_count=defect_count,
                marker_color=style["color"],
                marker_radius=style["radius"],
            )

            feature = GeoJSONFeature[InfrastructureGeoProperties](
                id=infra.id,
                geometry=GeoJSONGeometry(
                    type="Point",
                    coordinates=[infra.longitude, infra.latitude],  # GeoJSON standard: [lng, lat]
                ),
                properties=props,
            )
            features.append(feature)

        return GeoJSONFeatureCollection[InfrastructureGeoProperties](
            features=features,
            metadata={
                "total_assets": len(features),
                "crs": "urn:ogc:def:crs:OGC:1.3:CRS84",
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def get_defect_features(
        self,
        db: Session,
        infrastructure_id: Optional[int] = None,
        severity: Optional[str] = None,
    ) -> GeoJSONFeatureCollection[DefectGeoProperties]:
        """Convert geo-tagged structural defects into GeoJSON point features."""
        query = db.query(Defect).join(Infrastructure, Defect.infrastructure_id == Infrastructure.id)

        if infrastructure_id:
            query = query.filter(Defect.infrastructure_id == infrastructure_id)
        if severity:
            query = query.filter(Defect.severity == severity.upper())

        defects = query.all()
        features = []

        for d in defects:
            lat = d.latitude if d.latitude is not None else d.infrastructure.latitude
            lng = d.longitude if d.longitude is not None else d.infrastructure.longitude

            color = DEFECT_COLOR_PALETTE.get(d.severity.upper(), "#EAB308")

            props = DefectGeoProperties(
                id=d.id,
                infrastructure_id=d.infrastructure_id,
                infrastructure_name=d.infrastructure.name,
                defect_type=d.defect_type,
                severity=d.severity,
                confidence=round(d.confidence, 2),
                detected_at=d.detected_at,
                image_path=d.image_path,
                processed_image_path=d.processed_image_path,
                marker_color=color,
            )

            feature = GeoJSONFeature[DefectGeoProperties](
                id=d.id,
                geometry=GeoJSONGeometry(
                    type="Point",
                    coordinates=[lng, lat],  # GeoJSON standard: [lng, lat]
                ),
                properties=props,
            )
            features.append(feature)

        return GeoJSONFeatureCollection[DefectGeoProperties](
            features=features,
            metadata={
                "total_defects": len(features),
                "crs": "urn:ogc:def:crs:OGC:1.3:CRS84",
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def get_heatmap_points(self, db: Session) -> HeatmapResponse:
        """
        Generate coordinate dataset formatted for frontend geospatial heatmaps
        (Mapbox GL Heatmap / Leaflet heat / Google Maps Visualization Layer).
        """
        points: List[HeatmapPoint] = []
        lats: List[float] = []
        lngs: List[float] = []

        # 1. Defect Heatmap Points
        defects = db.query(Defect).join(Infrastructure, Defect.infrastructure_id == Infrastructure.id).all()
        defect_weights = {
            "CRITICAL": {"intensity": 1.0, "weight": 10.0},
            "HIGH": {"intensity": 0.75, "weight": 7.0},
            "MODERATE": {"intensity": 0.50, "weight": 4.0},
            "LOW": {"intensity": 0.25, "weight": 2.0},
        }

        for d in defects:
            lat = d.latitude if d.latitude is not None else d.infrastructure.latitude
            lng = d.longitude if d.longitude is not None else d.infrastructure.longitude
            w_info = defect_weights.get(d.severity.upper(), {"intensity": 0.5, "weight": 4.0})

            points.append(
                HeatmapPoint(
                    latitude=lat,
                    longitude=lng,
                    intensity=w_info["intensity"],
                    weight=w_info["weight"],
                    category="defect",
                    source_type=d.defect_type,
                    source_id=d.id,
                )
            )
            lats.append(lat)
            lngs.append(lng)

        # 2. Infrastructure Risk Density Points
        infras = db.query(Infrastructure).all()
        for infra in infras:
            pred = (
                db.query(Prediction)
                .filter(Prediction.infrastructure_id == infra.id)
                .order_by(Prediction.prediction_date.desc())
                .first()
            )
            risk = pred.risk_level if pred else "LOW"
            if risk in ("CRITICAL", "HIGH", "MODERATE"):
                intensity = 0.90 if risk == "CRITICAL" else 0.65 if risk == "HIGH" else 0.40
                weight = 8.0 if risk == "CRITICAL" else 5.0 if risk == "HIGH" else 3.0

                points.append(
                    HeatmapPoint(
                        latitude=infra.latitude,
                        longitude=infra.longitude,
                        intensity=intensity,
                        weight=weight,
                        category="infrastructure_risk",
                        source_type=infra.infrastructure_type,
                        source_id=infra.id,
                    )
                )
                lats.append(infra.latitude)
                lngs.append(infra.longitude)

        # Compute geographical bounding box
        bounds = {
            "min_latitude": min(lats) if lats else -90.0,
            "max_latitude": max(lats) if lats else 90.0,
            "min_longitude": min(lngs) if lngs else -180.0,
            "max_longitude": max(lngs) if lngs else 180.0,
        }

        return HeatmapResponse(
            points=points,
            total_points=len(points),
            bounds=bounds,
            generated_at=datetime.now(timezone.utc),
        )


geospatial_service = GeospatialService()
