from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.schemas.dashboard import (
    OverviewMetrics,
    HealthDistribution,
    DashboardAlertItem,
    DashboardOverviewResponse,
    DefectCategoryStat,
    SeverityStat,
    SensorActivityStat,
    DashboardAnalyticsResponse,
    DashboardAlertsResponse,
    DashboardInfrastructureItem,
)
from backend.app.services.risk.engine import risk_engine


class DashboardService:
    def get_overview(self, db: Session) -> DashboardOverviewResponse:
        """Fetch high-level overview metrics, risk distribution, and urgent alerts for React dashboard cards."""
        total_infras = db.query(func.count(Infrastructure.id)).scalar() or 0
        total_defects = db.query(func.count(Defect.id)).scalar() or 0
        active_alerts = (
            db.query(func.count(Alert.id))
            .filter(Alert.status == "ACTIVE")
            .scalar()
            or 0
        )

        # Unique active sensors
        active_sensors = (
            db.query(func.count(func.distinct(SensorReading.sensor_id))).scalar() or 0
        )

        # Assess risk across infrastructure
        infras = db.query(Infrastructure).all()
        health_scores = []
        low_cnt = mod_cnt = high_cnt = crit_cnt = 0

        for infra in infras:
            assessment = risk_engine.assess_infrastructure(db, infra.id)
            score = assessment.overall_health_score
            health_scores.append(score)
            risk = assessment.risk_level.value
            if risk == "LOW":
                low_cnt += 1
            elif risk == "MODERATE":
                mod_cnt += 1
            elif risk == "HIGH":
                high_cnt += 1
            elif risk == "CRITICAL":
                crit_cnt += 1

        avg_health = round(sum(health_scores) / len(health_scores), 1) if health_scores else 100.0

        # Recent alerts (top 8)
        recent_alert_objs = (
            db.query(Alert)
            .join(Infrastructure, Alert.infrastructure_id == Infrastructure.id)
            .order_by(Alert.created_at.desc())
            .limit(8)
            .all()
        )
        recent_alerts = [
            DashboardAlertItem(
                id=a.id,
                infrastructure_id=a.infrastructure_id,
                infrastructure_name=a.infrastructure.name,
                alert_type=a.alert_type,
                severity=a.severity,
                message=a.message,
                status=a.status,
                created_at=a.created_at,
            )
            for a in recent_alert_objs
        ]

        metrics = OverviewMetrics(
            total_infrastructure=total_infras,
            total_detected_defects=total_defects,
            critical_risk_count=crit_cnt,
            average_health_score=avg_health,
            active_alerts_count=active_alerts,
            active_sensors_count=active_sensors,
        )

        distribution = HealthDistribution(
            low_risk=low_cnt,
            moderate_risk=mod_cnt,
            high_risk=high_cnt,
            critical_risk=crit_cnt,
        )

        return DashboardOverviewResponse(
            metrics=metrics,
            health_distribution=distribution,
            recent_alerts=recent_alerts,
            generated_at=datetime.now(timezone.utc),
        )

    def get_analytics(self, db: Session) -> DashboardAnalyticsResponse:
        """Fetch granular analytics, defect category breakdowns, and 24h IoT telemetry trends."""
        # 1. Defect categories breakdown
        total_defects = db.query(func.count(Defect.id)).scalar() or 0
        cat_counts = (
            db.query(Defect.defect_type, func.count(Defect.id))
            .group_by(Defect.defect_type)
            .all()
        )
        categories = []
        for cat, cnt in cat_counts:
            pct = round((cnt / total_defects) * 100.0, 1) if total_defects > 0 else 0.0
            categories.append(DefectCategoryStat(category=cat, count=cnt, percentage=pct))

        # 2. Defect severities breakdown
        sev_counts = (
            db.query(Defect.severity, func.count(Defect.id))
            .group_by(Defect.severity)
            .all()
        )
        severities = [SeverityStat(severity=sev, count=cnt) for sev, cnt in sev_counts]

        # 3. Sensor activity (last 24 hours or overall)
        now_utc = datetime.now(timezone.utc)
        since_24h = now_utc - timedelta(hours=24)

        readings_24h = (
            db.query(func.count(SensorReading.id))
            .filter(SensorReading.timestamp >= since_24h)
            .scalar()
            or 0
        )
        # If no readings in last 24h (e.g. static seed data), use all readings
        if readings_24h == 0:
            readings_24h = db.query(func.count(SensorReading.id)).scalar() or 0

        anomalies_24h = (
            db.query(func.count(SensorReading.id))
            .filter(SensorReading.is_anomaly == True)
            .scalar()
            or 0
        )

        anom_rate = (
            round((anomalies_24h / readings_24h) * 100.0, 2)
            if readings_24h > 0
            else 0.0
        )

        sensors = [
            s[0]
            for s in db.query(SensorReading.sensor_id).distinct().limit(10).all()
        ]

        sensor_stat = SensorActivityStat(
            total_readings_24h=readings_24h,
            anomalies_24h=anomalies_24h,
            anomaly_rate_pct=anom_rate,
            active_sensors_list=sensors,
        )

        # 4. Infrastructure type breakdown
        type_counts = (
            db.query(Infrastructure.infrastructure_type, func.count(Infrastructure.id))
            .group_by(Infrastructure.infrastructure_type)
            .all()
        )
        type_breakdown = {t: c for t, c in type_counts}

        return DashboardAnalyticsResponse(
            defect_categories=categories,
            defect_severities=severities,
            sensor_activity=sensor_stat,
            infrastructure_type_breakdown=type_breakdown,
            generated_at=now_utc,
        )

    def get_alerts(
        self,
        db: Session,
        status_filter: Optional[str] = None,
        severity_filter: Optional[str] = None,
        limit: int = 50,
    ) -> DashboardAlertsResponse:
        """Fetch alerts list with status counts (Active, Acknowledged, Resolved)."""
        total = db.query(func.count(Alert.id)).scalar() or 0
        active = (
            db.query(func.count(Alert.id))
            .filter(Alert.status == "ACTIVE")
            .scalar()
            or 0
        )
        acked = (
            db.query(func.count(Alert.id))
            .filter(Alert.status == "ACKNOWLEDGED")
            .scalar()
            or 0
        )
        resolved = (
            db.query(func.count(Alert.id))
            .filter(Alert.status == "RESOLVED")
            .scalar()
            or 0
        )

        query = db.query(Alert).join(Infrastructure, Alert.infrastructure_id == Infrastructure.id)
        if status_filter:
            query = query.filter(Alert.status == status_filter.upper())
        if severity_filter:
            query = query.filter(Alert.severity == severity_filter.upper())

        alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

        alert_items = [
            DashboardAlertItem(
                id=a.id,
                infrastructure_id=a.infrastructure_id,
                infrastructure_name=a.infrastructure.name,
                alert_type=a.alert_type,
                severity=a.severity,
                message=a.message,
                status=a.status,
                created_at=a.created_at,
            )
            for a in alerts
        ]

        return DashboardAlertsResponse(
            total_alerts=total,
            active_alerts=active,
            acknowledged_alerts=acked,
            resolved_alerts=resolved,
            alerts=alert_items,
        )

    def get_infrastructure_table(
        self, db: Session
    ) -> List[DashboardInfrastructureItem]:
        """Fetch all infrastructure rows with current health, risk status, and component counts."""
        infras = db.query(Infrastructure).all()
        table = []

        for infra in infras:
            defects_cnt = (
                db.query(func.count(Defect.id))
                .filter(Defect.infrastructure_id == infra.id)
                .scalar()
                or 0
            )
            sensors_cnt = (
                db.query(func.count(func.distinct(SensorReading.sensor_id)))
                .filter(SensorReading.infrastructure_id == infra.id)
                .scalar()
                or 0
            )

            # Latest prediction
            pred = (
                db.query(Prediction)
                .filter(Prediction.infrastructure_id == infra.id)
                .order_by(Prediction.prediction_date.desc())
                .first()
            )

            assessment = risk_engine.assess_infrastructure(db, infra.id)

            table.append(
                DashboardInfrastructureItem(
                    id=infra.id,
                    name=infra.name,
                    infrastructure_type=infra.infrastructure_type,
                    location=infra.location,
                    latitude=infra.latitude,
                    longitude=infra.longitude,
                    construction_year=infra.construction_year,
                    material_type=infra.material_type,
                    health_score=assessment.overall_health_score,
                    risk_level=assessment.risk_level.value,
                    inspection_priority=assessment.inspection_priority.value,
                    defects_count=defects_cnt,
                    sensors_count=sensors_cnt,
                    predicted_rul_years=pred.predicted_rul if pred else None,
                )
            )

        return table


dashboard_service = DashboardService()
