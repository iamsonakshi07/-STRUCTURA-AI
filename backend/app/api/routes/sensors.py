from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, require_roles
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.sensors import (
    SensorReadingCreate,
    SensorReadingResponse,
    SensorBatchCreate,
    SensorBatchResponse,
    SensorSimulateRequest,
)
from backend.app.schemas.common import APIResponse, response_success
from backend.app.services.sensors.service import sensor_service

router = APIRouter(prefix="/sensors", tags=["Sensor Analytics"])


@router.post("/data", response_model=APIResponse[SensorReadingResponse], status_code=status.HTTP_201_CREATED)
def record_sensor_data(
    reading_in: SensorReadingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """
    Ingest a single real-time IoT vibration sensor reading.
    Analyzes telemetry with Isolation Forest to detect abnormal vibration and acceleration patterns.
    """
    reading = sensor_service.record_single_reading(db, reading_in)
    return response_success(data=reading.model_dump(), message="Sensor telemetry recorded successfully")


@router.post("/batch", response_model=APIResponse[SensorBatchResponse], status_code=status.HTTP_201_CREATED)
def record_sensor_batch(
    batch_in: SensorBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """
    Ingest a batch of vibration telemetry.
    Calculates statistical features (Mean, Std, RMS, Peak, Crest Factor) and flags anomalies.
    """
    batch_res = sensor_service.record_batch(db, batch_in)
    return response_success(data=batch_res.model_dump(), message="Batch sensor telemetry processed successfully")


@router.get("/{infrastructure_id}/readings", response_model=APIResponse[List[SensorReadingResponse]])
def get_sensor_readings(
    infrastructure_id: int,
    sensor_id: Optional[str] = Query(None, description="Filter by sensor identifier"),
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve historical telemetry readings for an infrastructure asset."""
    readings = sensor_service.get_readings(
        db,
        infrastructure_id=infrastructure_id,
        sensor_id=sensor_id,
        limit=limit,
        skip=skip,
    )
    data = [r.model_dump() for r in readings]
    return response_success(data=data, message=f"Retrieved {len(data)} sensor readings")


@router.get("/{infrastructure_id}/anomalies", response_model=APIResponse[List[SensorReadingResponse]])
def get_sensor_anomalies(
    infrastructure_id: int,
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detected vibration anomalies for an infrastructure asset."""
    anomalies = sensor_service.get_anomalies(
        db, infrastructure_id=infrastructure_id, limit=limit, skip=skip
    )
    data = [a.model_dump() for a in anomalies]
    return response_success(data=data, message=f"Retrieved {len(data)} anomalous sensor readings")


@router.post("/simulate", response_model=APIResponse[SensorBatchResponse], status_code=status.HTTP_201_CREATED)
def simulate_sensor_telemetry(
    sim_in: SensorSimulateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "inspector")),
):
    """
    Generate and persist realistic synthetic vibration telemetry for end-to-end testing and demonstrations.
    Simulates ambient dynamic loading with configurable anomaly injection.
    """
    result = sensor_service.simulate_telemetry(db, sim_in)
    return response_success(
        data=result.model_dump(),
        message=f"Simulated {result.saved_count} sensor telemetry readings successfully",
    )
