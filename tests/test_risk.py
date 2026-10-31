import pytest
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.schemas.risk import RiskLevel, InspectionPriority


@pytest.fixture
def test_infrastructure_assets(db_session):
    # 1. Healthy Asset
    healthy = Infrastructure(
        name="New Millennium Bridge",
        infrastructure_type="bridge",
        location="Portland, OR",
        latitude=45.5152,
        longitude=-122.6784,
        construction_year=2021,
        material_type="steel",
    )
    # 2. Critical Asset
    critical = Infrastructure(
        name="Old River Dam",
        infrastructure_type="dam",
        location="Austin, TX",
        latitude=30.2672,
        longitude=-97.7431,
        construction_year=1948,
        material_type="reinforced_concrete",
    )
    db_session.add_all([healthy, critical])
    db_session.commit()
    db_session.refresh(healthy)
    db_session.refresh(critical)

    # Add critical defects & high vibrations to critical asset
    crit_defect = Defect(
        infrastructure_id=critical.id,
        defect_type="crack",
        severity="CRITICAL",
        confidence=0.96,
        image_path="uploads/crit_crack.jpg",
    )
    db_session.add(crit_defect)

    for i in range(15):
        vib_reading = SensorReading(
            infrastructure_id=critical.id,
            sensor_id="VIB-01",
            vibration=8.5,
            acceleration=2.4,
            frequency=32.0,
            is_anomaly=True,
            anomaly_score=-0.22,
        )
        db_session.add(vib_reading)

    db_session.commit()
    return {"healthy": healthy, "critical": critical}


def test_risk_assessment_healthy_vs_critical(client, inspector_headers, test_infrastructure_assets, db_session):
    healthy_id = test_infrastructure_assets["healthy"].id
    critical_id = test_infrastructure_assets["critical"].id

    # 1. Evaluate healthy asset
    healthy_res = client.get(f"/api/v1/risk/{healthy_id}", headers=inspector_headers)
    assert healthy_res.status_code == 200
    healthy_data = healthy_res.json()["data"]
    assert healthy_data["overall_health_score"] >= 80.0
    assert healthy_data["risk_level"] == RiskLevel.LOW.value
    assert healthy_data["inspection_priority"] == InspectionPriority.ROUTINE.value

    # 2. Evaluate critical asset
    crit_res = client.get(f"/api/v1/risk/{critical_id}", headers=inspector_headers)
    assert crit_res.status_code == 200
    crit_data = crit_res.json()["data"]
    assert crit_data["overall_health_score"] <= 40.0
    assert crit_data["risk_level"] == RiskLevel.CRITICAL.value
    assert crit_data["inspection_priority"] == InspectionPriority.IMMEDIATE_ACTION.value
    assert "Critical" in crit_data["recommended_action"] or "CRITICAL" in crit_data["recommended_action"]
    assert "DISCLAIMER" in crit_data["engineering_disclaimer"]

    # Verify Alert was generated for critical asset
    alert = db_session.query(Alert).filter(
        Alert.infrastructure_id == critical_id,
        Alert.alert_type == "HIGH_RISK",
    ).first()
    assert alert is not None


def test_portfolio_risk_summary_and_critical_list(client, inspector_headers, test_infrastructure_assets):
    # 1. Summary
    sum_res = client.get("/api/v1/risk/summary", headers=inspector_headers)
    assert sum_res.status_code == 200
    sum_data = sum_res.json()["data"]
    assert sum_data["total_assets"] >= 2
    assert sum_data["critical_risk_count"] >= 1
    assert sum_data["low_risk_count"] >= 1
    assert sum_data["assets_requiring_inspection"] >= 1

    # 2. Critical assets list
    crit_res = client.get("/api/v1/risk/critical", headers=inspector_headers)
    assert crit_res.status_code == 200
    crit_list = crit_res.json()["data"]
    assert len(crit_list) >= 1
    crit_names = [c["infrastructure_name"] for c in crit_list]
    assert "Old River Dam" in crit_names
