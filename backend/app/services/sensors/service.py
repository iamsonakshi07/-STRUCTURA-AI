from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.ml.anomaly.isolation_forest import isolation_forest_detector
from backend.app.ml.anomaly.statistical import compute_vibration_statistics
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.sensor import SensorReading
from backend.app.models.alert import Alert
from backend.app.schemas.sensors import (
    SensorReadingCreate,
    SensorReadingResponse,
    SensorBatchItem,
    SensorBatchCreate,
    SensorBatchResponse,
    SensorStatisticalSummary,
    SensorSimulateRequest,
)


class SensorAnalyticsService:
    def record_single_reading(
        self, db: Session, reading_in: SensorReadingCreate
    ) -> SensorReadingResponse:
        """Validate, evaluate anomaly status, persist single IoT vibration reading, and alert if necessary."""
        infra = (
            db.query(Infrastructure)
            .filter(Infrastructure.id == reading_in.infrastructure_id)
            .first()
        )
        if not infra:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Infrastructure asset with id {reading_in.infrastructure_id} not found",
            )

        # Run anomaly detection
        is_anom, score = isolation_forest_detector.predict_single(
            vibration=reading_in.vibration,
            acceleration=reading_in.acceleration,
            frequency=reading_in.frequency,
        )

        ts = reading_in.timestamp or datetime.now(timezone.utc)
        reading_obj = SensorReading(
            infrastructure_id=reading_in.infrastructure_id,
            sensor_id=reading_in.sensor_id,
            vibration=reading_in.vibration,
            acceleration=reading_in.acceleration,
            frequency=reading_in.frequency,
            timestamp=ts,
            is_anomaly=is_anom,
            anomaly_score=score,
        )
        db.add(reading_obj)
        db.commit()
        db.refresh(reading_obj)

        # Generate alert if anomaly detected
        if is_anom:
            severity = "CRITICAL" if reading_in.vibration > 8.0 else "HIGH" if reading_in.vibration > 5.0 else "MODERATE"
            alert = Alert(
                infrastructure_id=reading_in.infrastructure_id,
                alert_type="SENSOR_ANOMALY",
                severity=severity,
                message=(
                    f"Vibration anomaly detected on {infra.name} (Sensor {reading_in.sensor_id}): "
                    f"Vibration={reading_in.vibration:.2f} mm/s, Accel={reading_in.acceleration:.2f} m/s^2, Score={score:.3f}."
                ),
                status="ACTIVE",
            )
            db.add(alert)
            db.commit()

        return SensorReadingResponse.model_validate(reading_obj)

    def record_batch(
        self, db: Session, batch_in: SensorBatchCreate
    ) -> SensorBatchResponse:
        """Process batch vibration telemetry, compute statistical features, evaluate anomalies, and store records."""
        infra = (
            db.query(Infrastructure)
            .filter(Infrastructure.id == batch_in.infrastructure_id)
            .first()
        )
        if not infra:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Infrastructure asset with id {batch_in.infrastructure_id} not found",
            )

        features = np.array(
            [[r.vibration, r.acceleration, r.frequency] for r in batch_in.readings],
            dtype=float,
        )

        is_anomalies, scores = isolation_forest_detector.predict_batch(features)

        # Compute statistical summary
        raw_dicts = [r.model_dump() for r in batch_in.readings]
        stats = compute_vibration_statistics(raw_dicts)

        db_entities = []
        anomaly_count = 0
        now_utc = datetime.now(timezone.utc)

        for i, r in enumerate(batch_in.readings):
            is_anom = is_anomalies[i]
            if is_anom:
                anomaly_count += 1

            ts = r.timestamp or now_utc
            entity = SensorReading(
                infrastructure_id=batch_in.infrastructure_id,
                sensor_id=r.sensor_id,
                vibration=r.vibration,
                acceleration=r.acceleration,
                frequency=r.frequency,
                timestamp=ts,
                is_anomaly=is_anom,
                anomaly_score=scores[i],
            )
            db_entities.append(entity)

        db.add_all(db_entities)
        db.commit()

        # Alert if anomalies were detected in the batch
        if anomaly_count > 0:
            highest_vib = float(np.max(features[:, 0]))
            severity = "CRITICAL" if highest_vib > 8.0 else "HIGH" if highest_vib > 5.0 else "MODERATE"
            alert = Alert(
                infrastructure_id=batch_in.infrastructure_id,
                alert_type="SENSOR_ANOMALY",
                severity=severity,
                message=(
                    f"Batch telemetry anomaly on {infra.name}: detected {anomaly_count} anomalous readings "
                    f"out of {len(batch_in.readings)} samples. Peak vibration: {highest_vib:.2f} mm/s."
                ),
                status="ACTIVE",
            )
            db.add(alert)
            db.commit()

        # Refresh entities for output response
        for entity in db_entities:
            db.refresh(entity)

        summary_obj = SensorStatisticalSummary(
            total_samples=len(batch_in.readings),
            anomaly_count=anomaly_count,
            vibration_mean=stats["vibration_mean"],
            vibration_std=stats["vibration_std"],
            vibration_rms=stats["vibration_rms"],
            vibration_peak=stats["vibration_peak"],
            crest_factor=stats["crest_factor"],
            dominant_frequency_mean=stats["dominant_frequency_mean"],
        )

        return SensorBatchResponse(
            infrastructure_id=batch_in.infrastructure_id,
            summary=summary_obj,
            saved_count=len(db_entities),
            anomalies_detected=anomaly_count,
            readings=[SensorReadingResponse.model_validate(e) for e in db_entities],
        )

    def get_readings(
        self,
        db: Session,
        infrastructure_id: int,
        sensor_id: Optional[str] = None,
        limit: int = 100,
        skip: int = 0,
    ) -> List[SensorReadingResponse]:
        """Fetch historical sensor readings for an infrastructure asset."""
        query = db.query(SensorReading).filter(
            SensorReading.infrastructure_id == infrastructure_id
        )
        if sensor_id:
            query = query.filter(SensorReading.sensor_id == sensor_id)
        readings = (
            query.order_by(SensorReading.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [SensorReadingResponse.model_validate(r) for r in readings]

    def get_anomalies(
        self,
        db: Session,
        infrastructure_id: int,
        limit: int = 100,
        skip: int = 0,
    ) -> List[SensorReadingResponse]:
        """Fetch only anomalous sensor telemetry for an infrastructure asset."""
        readings = (
            db.query(SensorReading)
            .filter(
                SensorReading.infrastructure_id == infrastructure_id,
                SensorReading.is_anomaly == True,
            )
            .order_by(SensorReading.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [SensorReadingResponse.model_validate(r) for r in readings]

    def simulate_telemetry(
        self, db: Session, req: SensorSimulateRequest
    ) -> SensorBatchResponse:
        """
        Generate realistic synthetic vibration telemetry for end-to-end demonstrations.
        Simulates baseline harmonic structural vibrations with realistic ambient noise,
        and optionally injects structural anomalies (transient resonance or impact spikes).
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

        np.random.seed(int(datetime.now(timezone.utc).timestamp()) % 10000)
        n = req.num_samples
        now = datetime.now(timezone.utc)

        # Base sinusoidal structural oscillation (traffic / wind ambient vibration)
        time_steps = np.linspace(0, 10, n)
        base_vib = 1.6 + 0.6 * np.sin(2 * np.pi * 0.5 * time_steps) + np.random.normal(0, 0.2, n)
        base_acc = 0.35 + 0.15 * np.sin(2 * np.pi * 0.5 * time_steps) + np.random.normal(0, 0.05, n)
        base_freq = np.random.normal(7.8, 1.2, n)

        # Inject anomalies if requested
        if req.inject_anomalies and req.anomaly_ratio > 0:
            num_anom = max(1, int(n * req.anomaly_ratio))
            anomaly_indices = np.random.choice(n, size=num_anom, replace=False)
            for idx in anomaly_indices:
                # Resonance or shock impact
                base_vib[idx] = np.random.uniform(6.5, 12.0)
                base_acc[idx] = np.random.uniform(1.8, 3.8)
                base_freq[idx] = np.random.uniform(25.0, 48.0)

        batch_items = []
        for i in range(n):
            ts = now - timedelta(seconds=(n - i) * 5)
            batch_items.append(
                SensorBatchItem(
                    sensor_id=req.sensor_id,
                    vibration=round(float(np.clip(base_vib[i], 0.2, 20.0)), 3),
                    acceleration=round(float(np.clip(base_acc[i], 0.05, 5.0)), 3),
                    frequency=round(float(np.clip(base_freq[i], 1.0, 60.0)), 2),
                    timestamp=ts,
                )
            )

        batch_create = SensorBatchCreate(
            infrastructure_id=req.infrastructure_id, readings=batch_items
        )
        return self.record_batch(db, batch_create)


sensor_service = SensorAnalyticsService()
