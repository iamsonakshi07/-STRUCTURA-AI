from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert


def test_models_and_relationships_integrity(db_session):
    # 1. Create Infrastructure
    bridge = Infrastructure(
        name="Bay Bridge Viaduct",
        infrastructure_type="bridge",
        location="San Francisco, CA",
        latitude=37.7983,
        longitude=-122.3778,
        construction_year=1936,
        material_type="steel",
    )
    db_session.add(bridge)
    db_session.commit()
    db_session.refresh(bridge)

    # 2. Add Defect
    defect = Defect(
        infrastructure_id=bridge.id,
        defect_type="corrosion",
        severity="HIGH",
        confidence=0.92,
        image_path="uploads/bay_bridge_pier.jpg",
        processed_image_path="processed/bay_bridge_pier_annotated.jpg",
        bounding_box='{"x1": 50, "y1": 60, "x2": 200, "y2": 250}',
        latitude=37.7983,
        longitude=-122.3778,
    )
    db_session.add(defect)

    # 3. Add Sensor Reading
    reading = SensorReading(
        infrastructure_id=bridge.id,
        sensor_id="VIB-01",
        vibration=4.85,
        acceleration=1.22,
        frequency=12.4,
        is_anomaly=True,
        anomaly_score=-0.15,
    )
    db_session.add(reading)

    # 4. Add Prediction
    pred = Prediction(
        infrastructure_id=bridge.id,
        component_id="pier-deck-bearing",
        predicted_rul=14.5,
        risk_level="MODERATE",
        confidence=0.88,
        health_score=78.5,
        factors='{"age_penalty": 15, "corrosion_penalty": 6.5}',
    )
    db_session.add(pred)

    # 5. Add Alert
    alert = Alert(
        infrastructure_id=bridge.id,
        alert_type="SENSOR_ANOMALY",
        severity="HIGH",
        message="Vibration threshold exceeded on sensor VIB-01",
        status="ACTIVE",
    )
    db_session.add(alert)
    db_session.commit()

    # Query back and verify relationships
    queried = db_session.query(Infrastructure).filter(Infrastructure.id == bridge.id).first()
    assert len(queried.defects) == 1
    assert queried.defects[0].defect_type == "corrosion"
    assert len(queried.sensor_readings) == 1
    assert queried.sensor_readings[0].is_anomaly is True
    assert len(queried.predictions) == 1
    assert queried.predictions[0].predicted_rul == 14.5
    assert len(queried.alerts) == 1
    assert queried.alerts[0].status == "ACTIVE"

    # Test Cascade Delete
    db_session.delete(queried)
    db_session.commit()

    assert db_session.query(Defect).filter(Defect.infrastructure_id == bridge.id).count() == 0
    assert db_session.query(SensorReading).filter(SensorReading.infrastructure_id == bridge.id).count() == 0
    assert db_session.query(Prediction).filter(Prediction.infrastructure_id == bridge.id).count() == 0
    assert db_session.query(Alert).filter(Alert.infrastructure_id == bridge.id).count() == 0


def test_infrastructure_api_crud(client, inspector_headers, admin_headers):
    # 1. Create Infrastructure
    payload = {
        "name": "Hoover Dam Spillway",
        "infrastructure_type": "dam",
        "location": "Clark County, Nevada",
        "latitude": 36.0160,
        "longitude": -114.7377,
        "construction_year": 1936,
        "material_type": "reinforced_concrete",
    }
    create_res = client.post("/api/v1/infrastructure/", json=payload, headers=inspector_headers)
    assert create_res.status_code == 201
    infra_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["name"] == "Hoover Dam Spillway"

    # 2. List Infrastructure
    list_res = client.get("/api/v1/infrastructure/", headers=inspector_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 3. Get Details
    detail_res = client.get(f"/api/v1/infrastructure/{infra_id}", headers=inspector_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["defects_count"] == 0

    # 4. Update Infrastructure
    update_res = client.put(
        f"/api/v1/infrastructure/{infra_id}",
        json={"name": "Hoover Dam Concrete Spillway Section A"},
        headers=inspector_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["name"] == "Hoover Dam Concrete Spillway Section A"

    # 5. Delete Infrastructure (Admin only)
    del_fail = client.delete(f"/api/v1/infrastructure/{infra_id}", headers=inspector_headers)
    assert del_fail.status_code == 403

    del_ok = client.delete(f"/api/v1/infrastructure/{infra_id}", headers=admin_headers)
    assert del_ok.status_code == 200
    assert del_ok.json()["success"] is True

    # Confirm 404 after deletion
    get_del = client.get(f"/api/v1/infrastructure/{infra_id}", headers=admin_headers)
    assert get_del.status_code == 404
