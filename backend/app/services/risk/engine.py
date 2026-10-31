from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import numpy as np
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.schemas.risk import (
    RiskLevel,
    InspectionPriority,
    RiskScoreBreakdown,
    InfrastructureRiskAssessment,
    PortfolioRiskSummary,
)

ENGINEERING_DISCLAIMER = (
    "DISCLAIMER: Structura AI risk scores and classifications are algorithmic indicators "
    "intended for inspection prioritization and anomaly triage. They do NOT constitute "
    "certified civil engineering structural adequacy sign-offs or legal safety guarantees."
)


class RiskAssessmentEngine:
    """
    Multimodal Risk Assessment Engine.
    Fuses computer vision defect detections, IoT vibration sensor analytics,
    remaining useful life (RUL) estimates, and structural age to generate
    composite health scores (0-100) and actionable inspection priorities.
    """

    def __init__(
        self,
        vision_weight: float = 0.35,
        sensor_weight: float = 0.25,
        rul_weight: float = 0.25,
        age_weight: float = 0.15,
    ):
        self.weights = {
            "vision": vision_weight,
            "sensor": sensor_weight,
            "rul": rul_weight,
            "age": age_weight,
        }

    def assess_infrastructure(
        self, db: Session, infrastructure_id: int
    ) -> InfrastructureRiskAssessment:
        """Execute comprehensive multi-factor risk assessment on a single asset."""
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

        now = datetime.now(timezone.utc)

        # 1. Vision Defect Score
        defects = (
            db.query(Defect)
            .filter(Defect.infrastructure_id == infrastructure_id)
            .all()
        )
        crit_defects = sum(1 for d in defects if d.severity.upper() == "CRITICAL")
        high_defects = sum(1 for d in defects if d.severity.upper() == "HIGH")
        mod_defects = sum(1 for d in defects if d.severity.upper() == "MODERATE")
        low_defects = sum(1 for d in defects if d.severity.upper() == "LOW")

        vision_penalty = (
            crit_defects * 25.0
            + high_defects * 15.0
            + mod_defects * 6.0
            + low_defects * 2.0
        )
        vision_score = round(float(np.clip(100.0 - vision_penalty, 0.0, 100.0)), 1)

        # 2. Sensor Vibration Score
        recent_readings = (
            db.query(SensorReading)
            .filter(SensorReading.infrastructure_id == infrastructure_id)
            .order_by(SensorReading.timestamp.desc())
            .limit(100)
            .all()
        )

        sensor_penalty = 0.0
        rms_val = 1.5
        recent_anomalies = 0

        if recent_readings:
            vibs = [r.vibration for r in recent_readings]
            rms_val = float(np.sqrt(np.mean(np.array(vibs) ** 2)))
            recent_anomalies = sum(1 for r in recent_readings if r.is_anomaly)

            if rms_val > 6.0:
                sensor_penalty += 40.0
            elif rms_val > 4.0:
                sensor_penalty += 20.0
            elif rms_val > 2.5:
                sensor_penalty += 8.0

            sensor_penalty += min(40.0, recent_anomalies * 5.0)

        sensor_score = round(float(np.clip(100.0 - sensor_penalty, 0.0, 100.0)), 1)

        # 3. RUL Prediction Score
        latest_pred = (
            db.query(Prediction)
            .filter(Prediction.infrastructure_id == infrastructure_id)
            .order_by(Prediction.prediction_date.desc())
            .first()
        )
        if latest_pred:
            rul_score = round(float(latest_pred.health_score), 1)
            rul_years = latest_pred.predicted_rul
        else:
            rul_score = 85.0
            rul_years = 25.0

        # 4. Structural Age Score
        design_lives = {
            "steel": 100.0,
            "reinforced_concrete": 75.0,
            "prestressed_concrete": 80.0,
            "masonry": 120.0,
        }
        design_life = design_lives.get(infra.material_type.lower(), 75.0)
        age = max(1.0, float(now.year - infra.construction_year))
        age_score = round(float(np.clip(100.0 * (1.0 - (age / design_life)), 5.0, 100.0)), 1)

        # Composite Health Score
        raw_health = (
            self.weights["vision"] * vision_score
            + self.weights["sensor"] * sensor_score
            + self.weights["rul"] * rul_score
            + self.weights["age"] * age_score
        )

        # Safety override: Critical defect or severe vibration limits health score
        if crit_defects > 0 or rms_val > 8.0:
            raw_health = min(raw_health, 38.0)

        health_score = round(float(np.clip(raw_health, 0.0, 100.0)), 1)

        # Risk Classification & Inspection Priority
        if health_score >= 80.0:
            risk_level = RiskLevel.LOW
            priority = InspectionPriority.ROUTINE
            rec_action = "Maintain regular bi-annual visual inspection and telemetry monitoring."
        elif health_score >= 60.0:
            risk_level = RiskLevel.MODERATE
            priority = InspectionPriority.MONITOR
            rec_action = "Schedule non-destructive testing (NDT) within 90 days; monitor crack propagation."
        elif health_score >= 40.0:
            risk_level = RiskLevel.HIGH
            priority = InspectionPriority.URGENT
            rec_action = "Dispatch inspection team within 14 days; perform ultrasonic rebar & load testing."
        else:
            risk_level = RiskLevel.CRITICAL
            priority = InspectionPriority.IMMEDIATE_ACTION
            rec_action = "CRITICAL: Restrict heavy vehicle loads immediately; mandate emergency engineering review."

        # Generate contextual risk explanation narrative
        explanations = []
        if crit_defects > 0 or high_defects > 0:
            explanations.append(
                f"{crit_defects + high_defects} high/critical surface defects detected (vision score {vision_score}/100)"
            )
        if rms_val > 3.0 or recent_anomalies > 0:
            explanations.append(
                f"vibration RMS of {rms_val:.2f} mm/s with {recent_anomalies} anomalous telemetry readings"
            )
        if rul_years < 10.0:
            explanations.append(f"accelerated life depreciation (estimated RUL: {rul_years:.1f}y)")
        if age > 50:
            explanations.append(f"advanced structural age of {int(age)} years")

        if explanations:
            narrative = f"Asset health assessed at {health_score}/100 due to " + "; ".join(explanations) + "."
        else:
            narrative = f"Asset exhibits nominal structural integrity with health score of {health_score}/100."

        # Trigger alert if HIGH or CRITICAL
        if risk_level in (RiskLevel.CRITICAL, RiskLevel.HIGH):
            alert = Alert(
                infrastructure_id=infra.id,
                alert_type="HIGH_RISK",
                severity=risk_level.value,
                message=f"Risk Engine Alert for {infra.name}: {narrative} Priority: {priority.value}.",
                status="ACTIVE",
            )
            db.add(alert)
            db.commit()

        breakdown = RiskScoreBreakdown(
            vision_score=vision_score,
            sensor_score=sensor_score,
            rul_score=rul_score,
            age_score=age_score,
            weights=self.weights,
        )

        return InfrastructureRiskAssessment(
            infrastructure_id=infra.id,
            infrastructure_name=infra.name,
            infrastructure_type=infra.infrastructure_type,
            location=infra.location,
            latitude=infra.latitude,
            longitude=infra.longitude,
            overall_health_score=health_score,
            risk_level=risk_level,
            inspection_priority=priority,
            risk_explanation=narrative,
            recommended_action=rec_action,
            score_breakdown=breakdown,
            active_defects_count=len(defects),
            recent_anomalies_count=recent_anomalies,
            estimated_rul_years=rul_years,
            assessed_at=now,
            engineering_disclaimer=ENGINEERING_DISCLAIMER,
        )

    def get_portfolio_summary(self, db: Session) -> PortfolioRiskSummary:
        """Compute portfolio-wide risk summary metrics across all infrastructure assets."""
        infras = db.query(Infrastructure).all()
        if not infras:
            return PortfolioRiskSummary(
                total_assets=0,
                average_health_score=100.0,
                low_risk_count=0,
                moderate_risk_count=0,
                high_risk_count=0,
                critical_risk_count=0,
                assets_requiring_inspection=0,
                generated_at=datetime.now(timezone.utc),
            )

        assessments = [self.assess_infrastructure(db, infra.id) for infra in infras]
        avg_health = float(np.mean([a.overall_health_score for a in assessments]))

        low_cnt = sum(1 for a in assessments if a.risk_level == RiskLevel.LOW)
        mod_cnt = sum(1 for a in assessments if a.risk_level == RiskLevel.MODERATE)
        high_cnt = sum(1 for a in assessments if a.risk_level == RiskLevel.HIGH)
        crit_cnt = sum(1 for a in assessments if a.risk_level == RiskLevel.CRITICAL)

        inspection_needed = high_cnt + crit_cnt

        return PortfolioRiskSummary(
            total_assets=len(infras),
            average_health_score=round(avg_health, 1),
            low_risk_count=low_cnt,
            moderate_risk_count=mod_cnt,
            high_risk_count=high_cnt,
            critical_risk_count=crit_cnt,
            assets_requiring_inspection=inspection_needed,
            generated_at=datetime.now(timezone.utc),
        )

    def get_critical_assets(
        self, db: Session
    ) -> List[InfrastructureRiskAssessment]:
        """Fetch all infrastructure assets requiring URGENT or IMMEDIATE action."""
        infras = db.query(Infrastructure).all()
        assessments = [self.assess_infrastructure(db, infra.id) for infra in infras]
        critical_assets = [
            a for a in assessments if a.risk_level in (RiskLevel.CRITICAL, RiskLevel.HIGH)
        ]
        # Sort by lowest health score first
        critical_assets.sort(key=lambda x: x.overall_health_score)
        return critical_assets


risk_engine = RiskAssessmentEngine()
