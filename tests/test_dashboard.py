import pytest
from datetime import datetime, timezone
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.websocket.manager import ws_manager


@pytest.fixture
def dashboard_test_dataset(db_session):
    # 1. Bridge
    bridge = Infrastructure(
        name="Golden Gate Bridge",
        infrastructure_type="bridge",
        location="San Francisco, CA",
        latitude=37.8199,
        longitude=-122.4783,
        construction_year=1937,
        material_type="steel",
    )
    # 2. Dam
    dam = Infrastructure(
        name="Hoover Dam",
        infrastructure_type="dam",
        location="Boulder City, NV",
        latitude=36.0160,
        longitude=-114.7377,
        construction_year=1936,
        material_type="reinforced_concrete",
    )
    db_session.add_all([bridge, dam])
    db_session.commit()
    db_session.refresh(bridge)
    db_session.refresh(dam)

    # Add Defects
    d1 = Defect(
        infrastructure_id=bridge.id,
        defect_type="corrosion",
        severity="HIGH",
        confidence=0.91,
        image_path="uploads/gg_corr.jpg",
    )
    d2 = Defect(
        infrastructure_id=dam.id,
        defect_type="crack",
        severity="CRITICAL",
        confidence=0.97,
        image_path="uploads/hoover_crack.jpg",
    )
    db_session.add_all([d1, d2])

    # Add Sensor Readings
    s1 = SensorReading(
        infrastructure_id=bridge.id,
        sensor_id="VIB-01",
        vibration=1.8,
        acceleration=0.35,
        frequency=8.2,
        is_anomaly=False,
    )
    s2 = SensorReading(
        infrastructure_id=dam.id,
        sensor_id="VIB-02",
        vibration=9.5,
        acceleration=2.8,
        frequency=35.0,
        is_anomaly=True,
    )
    db_session.add_all([s1, s2])

    # Add Alerts
    a1 = Alert(
        infrastructure_id=bridge.id,
        alert_type="DEFECT_DETECTED",
        severity="HIGH",
        message="Corrosion detected on bridge pier",
        status="ACTIVE",
    )
    a2 = Alert(
        infrastructure_id=dam.id,
        alert_type="SENSOR_ANOMALY",
        severity="CRITICAL",
        message="Critical vibration anomaly detected",
        status="ACTIVE",
    )
    db_session.add_all([a1, a2])

    # Add Prediction
    p1 = Prediction(
        infrastructure_id=bridge.id,
        component_id="deck",
        predicted_rul=15.0,
        risk_level="MODERATE",
        confidence=0.92,
        health_score=75.0,
    )
    db_session.add(p1)
    db_session.commit()

    return {"bridge": bridge, "dam": dam, "alert1": a1, "alert2": a2}


def test_dashboard_overview(client, inspector_headers, dashboard_test_dataset):
    response = client.get("/api/v1/dashboard/overview", headers=inspector_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    metrics = data["metrics"]
    assert metrics["total_infrastructure"] >= 2
    assert metrics["total_detected_defects"] >= 2
    assert metrics["active_alerts_count"] >= 2
    assert metrics["active_sensors_count"] >= 2
    assert 0.0 <= metrics["average_health_score"] <= 100.0

    dist = data["health_distribution"]
    assert dist["critical_risk"] >= 1  # Hoover Dam has critical defect & vibration

    assert len(data["recent_alerts"]) >= 2


def test_dashboard_analytics(client, inspector_headers, dashboard_test_dataset):
    response = client.get("/api/v1/dashboard/analytics", headers=inspector_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    # Check defect categories
    cats = {c["category"]: c["count"] for c in data["defect_categories"]}
    assert "corrosion" in cats
    assert "crack" in cats

    # Check severities
    sevs = {s["severity"]: s["count"] for s in data["defect_severities"]}
    assert "CRITICAL" in sevs
    assert "HIGH" in sevs

    # Check sensor telemetry stats
    sensor_act = data["sensor_activity"]
    assert sensor_act["total_readings_24h"] >= 2
    assert sensor_act["anomalies_24h"] >= 1
    assert "VIB-01" in sensor_act["active_sensors_list"] or "VIB-02" in sensor_act["active_sensors_list"]

    # Check types
    types = data["infrastructure_type_breakdown"]
    assert "bridge" in types
    assert "dam" in types


def test_dashboard_alerts_and_status_update(client, inspector_headers, dashboard_test_dataset):
    # 1. Fetch alerts
    response = client.get("/api/v1/dashboard/alerts", headers=inspector_headers)
    assert response.status_code == 200
    alerts_data = response.json()["data"]
    assert alerts_data["active_alerts"] >= 2

    # 2. Acknowledge alert 1
    alert_id = dashboard_test_dataset["alert1"].id
    ack_res = client.put(
        f"/api/v1/dashboard/alerts/{alert_id}/status?new_status=ACKNOWLEDGED",
        headers=inspector_headers,
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["data"]["status"] == "ACKNOWLEDGED"

    # 3. Check updated counts
    updated_res = client.get("/api/v1/dashboard/alerts", headers=inspector_headers)
    assert updated_res.json()["data"]["acknowledged_alerts"] >= 1


def test_dashboard_infrastructure_table(client, inspector_headers, dashboard_test_dataset):
    response = client.get("/api/v1/dashboard/infrastructure", headers=inspector_headers)
    assert response.status_code == 200
    items = response.json()["data"]
    assert len(items) >= 2

    names = [i["name"] for i in items]
    assert "Golden Gate Bridge" in names
    assert "Hoover Dam" in names

    first = items[0]
    assert "health_score" in first
    assert "risk_level" in first
    assert "inspection_priority" in first
    assert "defects_count" in first
    assert "sensors_count" in first


def test_websocket_alerts_stream(client):
    """Test live real-time WebSocket connection and communication."""
    with client.websocket_connect("/ws/alerts") as websocket:
        # Receive connection greeting
        greeting = websocket.receive_json()
        assert greeting["type"] == "CONNECTION_ESTABLISHED"

        # Send ping
        websocket.send_text("ping")
        pong = websocket.receive_text()
        assert pong == "pong"
