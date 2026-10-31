import numpy as np
import pytest
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.sensor import SensorReading
from backend.app.models.alert import Alert
from backend.app.ml.anomaly.lstm_autoencoder import lstm_anomaly_detector, LSTMAutoencoder


@pytest.fixture
def sample_infrastructure(db_session):
    infra = Infrastructure(
        name="Columbia River Dam",
        infrastructure_type="dam",
        location="Grand Coulee, WA",
        latitude=47.9571,
        longitude=-118.9814,
        construction_year=1942,
        material_type="concrete",
    )
    db_session.add(infra)
    db_session.commit()
    db_session.refresh(infra)
    return infra


def test_record_single_reading_and_anomaly_alert(client, inspector_headers, sample_infrastructure, db_session):
    # 1. Normal reading
    normal_payload = {
        "infrastructure_id": sample_infrastructure.id,
        "sensor_id": "VIB-TURBINE-01",
        "vibration": 1.45,
        "acceleration": 0.32,
        "frequency": 8.0,
    }
    norm_res = client.post("/api/v1/sensors/data", json=normal_payload, headers=inspector_headers)
    assert norm_res.status_code == 201
    norm_data = norm_res.json()["data"]
    assert norm_data["vibration"] == 1.45
    assert norm_data["is_anomaly"] is False

    # 2. Anomalous high-vibration reading
    anom_payload = {
        "infrastructure_id": sample_infrastructure.id,
        "sensor_id": "VIB-TURBINE-01",
        "vibration": 9.85,
        "acceleration": 2.75,
        "frequency": 35.0,
    }
    anom_res = client.post("/api/v1/sensors/data", json=anom_payload, headers=inspector_headers)
    assert anom_res.status_code == 201
    anom_data = anom_res.json()["data"]
    assert anom_data["is_anomaly"] is True

    # Check alert was triggered
    alert = db_session.query(Alert).filter(
        Alert.infrastructure_id == sample_infrastructure.id,
        Alert.alert_type == "SENSOR_ANOMALY",
    ).first()
    assert alert is not None
    assert alert.severity == "CRITICAL"


def test_record_batch_and_statistics(client, inspector_headers, sample_infrastructure):
    batch_payload = {
        "infrastructure_id": sample_infrastructure.id,
        "readings": [
            {"sensor_id": "ACCEL-01", "vibration": 1.0, "acceleration": 0.2, "frequency": 5.0},
            {"sensor_id": "ACCEL-01", "vibration": 2.0, "acceleration": 0.4, "frequency": 6.0},
            {"sensor_id": "ACCEL-01", "vibration": 3.0, "acceleration": 0.6, "frequency": 7.0},
            {"sensor_id": "ACCEL-01", "vibration": 10.5, "acceleration": 3.2, "frequency": 42.0},  # Anomaly
        ],
    }
    response = client.post("/api/v1/sensors/batch", json=batch_payload, headers=inspector_headers)
    assert response.status_code == 201
    res_data = response.json()["data"]

    summary = res_data["summary"]
    assert summary["total_samples"] == 4
    assert summary["anomaly_count"] >= 1
    assert summary["vibration_peak"] == 10.5
    assert summary["vibration_rms"] > 0
    assert summary["crest_factor"] > 0
    assert res_data["saved_count"] == 4


def test_query_readings_and_anomalies(client, inspector_headers, sample_infrastructure):
    # Simulate a stream first
    sim_payload = {
        "infrastructure_id": sample_infrastructure.id,
        "sensor_id": "SIM-SENSOR-01",
        "num_samples": 20,
        "inject_anomalies": True,
        "anomaly_ratio": 0.20,
    }
    sim_res = client.post("/api/v1/sensors/simulate", json=sim_payload, headers=inspector_headers)
    assert sim_res.status_code == 201

    # Fetch all readings
    readings_res = client.get(
        f"/api/v1/sensors/{sample_infrastructure.id}/readings",
        headers=inspector_headers,
    )
    assert readings_res.status_code == 200
    assert len(readings_res.json()["data"]) >= 20

    # Fetch only anomalies
    anomalies_res = client.get(
        f"/api/v1/sensors/{sample_infrastructure.id}/anomalies",
        headers=inspector_headers,
    )
    assert anomalies_res.status_code == 200
    anomalies = anomalies_res.json()["data"]
    assert len(anomalies) >= 1
    for a in anomalies:
        assert a["is_anomaly"] is True


def test_lstm_autoencoder_architecture():
    """Verify PyTorch LSTM Autoencoder forward pass, reconstruction, and anomaly interface."""
    model = LSTMAutoencoder(seq_len=10, input_dim=3)
    # Shape: (batch_size=2, seq_len=10, input_dim=3)
    dummy_input = np.random.randn(2, 10, 3).astype(np.float32)

    is_anom, error, reconstructed = lstm_anomaly_detector.predict_sequence(dummy_input[0])
    assert isinstance(is_anom, bool)
    assert error >= 0.0
    assert reconstructed.shape == (10, 3)
