import json
from datetime import datetime, timezone
from typing import List, Optional
import numpy as np
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.ml.rul.model import rul_model, SAFETY_DISCLAIMER
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.schemas.prediction import (
    RULPredictionRequest,
    RULPredictionResponse,
    ContributingFactors,
)


class RULPredictionService:
    def calculate_and_record_rul(
        self, db: Session, req: RULPredictionRequest
    ) -> RULPredictionResponse:
        """
        Calculates ML Remaining Useful Life by fusing:
        - Structural age & material nominal lifespan
        - Visual defect severities (cracks, corrosion, exposed rebar)
        - IoT dynamic vibration telemetry RMS
        - Environmental conditions & cyclic loading
        """
        infra = (
            db.query(Infrastructure)
            .filter(Infrastructure.id == req.infrastructure_id)
            .first()
        )
        if not infra:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Infrastructure asset with id {req.infrastructure_id} not found",
            )

        # 1. Determine defect penalty percentage
        if req.manual_defect_penalty is not None:
            defect_penalty = float(req.manual_defect_penalty)
        else:
            defects = (
                db.query(Defect)
                .filter(Defect.infrastructure_id == req.infrastructure_id)
                .all()
            )
            # Weights for defect severities
            weights = {"CRITICAL": 15.0, "HIGH": 8.0, "MODERATE": 3.0, "LOW": 1.0}
            raw_penalty = sum(weights.get(d.severity.upper(), 2.0) for d in defects)
            defect_penalty = float(min(60.0, raw_penalty))

        # 2. Determine vibration RMS in mm/s
        if req.manual_vibration_rms is not None:
            vib_rms = float(req.manual_vibration_rms)
        else:
            # Query recent 100 sensor readings
            recent_readings = (
                db.query(SensorReading.vibration)
                .filter(SensorReading.infrastructure_id == req.infrastructure_id)
                .order_by(SensorReading.timestamp.desc())
                .limit(100)
                .all()
            )
            if recent_readings:
                vibs = [r[0] for r in recent_readings]
                vib_rms = float(np.sqrt(np.mean(np.array(vibs) ** 2)))
            else:
                vib_rms = 1.5  # Normal baseline when no sensor is installed yet

        current_year = datetime.now(timezone.utc).year

        # 3. Predict via ML Model
        (
            rul_years,
            health_score,
            risk_level,
            factors,
            metadata,
        ) = rul_model.predict(
            construction_year=infra.construction_year,
            material_type=infra.material_type,
            current_year=current_year,
            defect_penalty_pct=defect_penalty,
            vibration_rms=vib_rms,
            environmental_condition=req.environmental_condition.value
            if req.environmental_condition
            else "urban",
            daily_traffic_volume=req.cyclic_loading_daily_volume or 25000,
        )

        rul_months = round(rul_years * 12.0, 1)
        confidence = 0.89

        # 4. Save Prediction record in database
        pred_record = Prediction(
            infrastructure_id=infra.id,
            component_id=req.component_id or "overall_structure",
            predicted_rul=rul_years,
            risk_level=risk_level,
            confidence=confidence,
            health_score=health_score,
            factors=json.dumps(factors.model_dump()),
            prediction_date=datetime.now(timezone.utc),
        )
        db.add(pred_record)
        db.commit()
        db.refresh(pred_record)

        # 5. Alert if RUL is critical or high risk
        if risk_level in ("CRITICAL", "HIGH"):
            alert_type = "RUL_CRITICAL" if risk_level == "CRITICAL" else "HIGH_RISK"
            alert = Alert(
                infrastructure_id=infra.id,
                alert_type=alert_type,
                severity=risk_level,
                message=(
                    f"RUL Alert on {infra.name}: Estimated remaining life is {rul_years:.1f} years "
                    f"({rul_months:.0f} months). Health Score: {health_score:.1f}/100. Priority inspection recommended."
                ),
                status="ACTIVE",
            )
            db.add(alert)
            db.commit()

        return RULPredictionResponse(
            id=pred_record.id,
            infrastructure_id=infra.id,
            component_id=pred_record.component_id,
            predicted_rul_years=rul_years,
            predicted_rul_months=rul_months,
            confidence_score=confidence,
            health_score=health_score,
            risk_level=risk_level,
            prediction_date=pred_record.prediction_date,
            contributing_factors=factors,
            model_metadata=metadata,
            safety_disclaimer=SAFETY_DISCLAIMER,
        )

    def get_latest_prediction(
        self, db: Session, infrastructure_id: int
    ) -> RULPredictionResponse:
        """Fetch the most recent RUL prediction for an infrastructure asset."""
        infra = (
            db.query(Infrastructure)
            .filter(Infrastructure.id == infrastructure_id)
            .first()
        )
        if not infra:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Infrastructure asset with id {infrastructure_id} not found",
            )

        pred = (
            db.query(Prediction)
            .filter(Prediction.infrastructure_id == infrastructure_id)
            .order_by(Prediction.prediction_date.desc())
            .first()
        )
        if not pred:
            # If no prediction has been computed yet, automatically compute one
            return self.calculate_and_record_rul(
                db, RULPredictionRequest(infrastructure_id=infrastructure_id)
            )

        factors_dict = json.loads(pred.factors) if pred.factors else {}
        factors = ContributingFactors(**factors_dict) if factors_dict else ContributingFactors(
            structural_age_years=float(datetime.now().year - infra.construction_year),
            design_life_years=75.0,
            age_depreciation_pct=50.0,
            defect_severity_impact_pct=0.0,
            vibration_fatigue_impact_pct=0.0,
            environmental_harshness_factor=1.15,
            cyclic_stress_factor=1.0,
        )

        metadata = {
            "model_type": "GradientBoostingRegressor (Physics-Informed Structural Degradation)",
            "mode": "PROTOTYPE_ESTIMATE",
            "version": "1.0.0",
        }

        return RULPredictionResponse(
            id=pred.id,
            infrastructure_id=infra.id,
            component_id=pred.component_id,
            predicted_rul_years=pred.predicted_rul,
            predicted_rul_months=round(pred.predicted_rul * 12.0, 1),
            confidence_score=pred.confidence,
            health_score=pred.health_score,
            risk_level=pred.risk_level,
            prediction_date=pred.prediction_date,
            contributing_factors=factors,
            model_metadata=metadata,
            safety_disclaimer=SAFETY_DISCLAIMER,
        )

    def get_prediction_history(
        self, db: Session, infrastructure_id: int
    ) -> List[RULPredictionResponse]:
        """Fetch historical RUL prediction log for an infrastructure asset."""
        infra = (
            db.query(Infrastructure)
            .filter(Infrastructure.id == infrastructure_id)
            .first()
        )
        if not infra:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Infrastructure asset with id {infrastructure_id} not found",
            )

        preds = (
            db.query(Prediction)
            .filter(Prediction.infrastructure_id == infrastructure_id)
            .order_by(Prediction.prediction_date.desc())
            .all()
        )

        responses = []
        for p in preds:
            factors_dict = json.loads(p.factors) if p.factors else {}
            factors = ContributingFactors(**factors_dict) if factors_dict else ContributingFactors(
                structural_age_years=float(datetime.now().year - infra.construction_year),
                design_life_years=75.0,
                age_depreciation_pct=50.0,
                defect_severity_impact_pct=0.0,
                vibration_fatigue_impact_pct=0.0,
                environmental_harshness_factor=1.15,
                cyclic_stress_factor=1.0,
            )
            metadata = {"model_type": "GradientBoostingRegressor", "mode": "PROTOTYPE_ESTIMATE"}
            responses.append(
                RULPredictionResponse(
                    id=p.id,
                    infrastructure_id=infra.id,
                    component_id=p.component_id,
                    predicted_rul_years=p.predicted_rul,
                    predicted_rul_months=round(p.predicted_rul * 12.0, 1),
                    confidence_score=p.confidence,
                    health_score=p.health_score,
                    risk_level=p.risk_level,
                    prediction_date=p.prediction_date,
                    contributing_factors=factors,
                    model_metadata=metadata,
                    safety_disclaimer=SAFETY_DISCLAIMER,
                )
            )
        return responses


prediction_service = RULPredictionService()
