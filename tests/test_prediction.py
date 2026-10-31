import pytest
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.alert import Alert
from backend.app.ml.rul.model import rul_model, SAFETY_DISCLAIMER


@pytest.fixture
def sample_infrastructure(db_session):
    infra = Infrastructure(
        name="Oakland Bay Viaduct",
        infrastructure_type="bridge",
        location="Oakland, CA",
        latitude=37.8044,
        longitude=-122.2712,
        construction_year=1970,
        material_type="steel",
    )
    db_session.add(infra)
    db_session.commit()
    db_session.refresh(infra)
    return infra


def test_rul_ml_model_unit():
    """Verify physical and statistical behavior of the RUL regression model."""
    # Test brand new bridge
    rul, health, risk, factors, meta = rul_model.predict(
        construction_year=2020,
        material_type="steel",
        current_year=2026,
        defect_penalty_pct=0.0,
        vibration_rms=1.2,
        environmental_condition="rural",
        daily_traffic_volume=10000,
    )
    assert rul > 50.0
    assert health >= 75.0
    assert risk in ("LOW", "MODERATE")
    assert factors.structural_age_years == 6.0
    assert meta["mode"] == "PROTOTYPE_ESTIMATE"

    # Test old, degraded bridge
    old_rul, old_health, old_risk, _, _ = rul_model.predict(
        construction_year=1930,
        material_type="reinforced_concrete",
        current_year=2026,
        defect_penalty_pct=45.0,
        vibration_rms=9.5,
        environmental_condition="marine",
        daily_traffic_volume=80000,
    )
    assert old_rul < rul
    assert old_health < health
    assert old_risk in ("HIGH", "CRITICAL")


def test_rul_api_calculation_and_alerts(client, inspector_headers, sample_infrastructure, db_session):
    # Add high-severity defects to DB
    defect1 = Defect(
        infrastructure_id=sample_infrastructure.id,
        defect_type="crack",
        severity="CRITICAL",
        confidence=0.95,
        image_path="uploads/crack1.jpg",
    )
    defect2 = Defect(
        infrastructure_id=sample_infrastructure.id,
        defect_type="corrosion",
        severity="HIGH",
        confidence=0.91,
        image_path="uploads/corrosion1.jpg",
    )
    db_session.add_all([defect1, defect2])
    db_session.commit()

    payload = {
        "infrastructure_id": sample_infrastructure.id,
        "component_id": "pier_column_4",
        "environmental_condition": "coastal",
        "cyclic_loading_daily_volume": 45000,
    }

    response = client.post("/api/v1/prediction/rul", json=payload, headers=inspector_headers)
    assert response.status_code == 201
    data = response.json()["data"]

    assert data["infrastructure_id"] == sample_infrastructure.id
    assert data["predicted_rul_years"] > 0
    assert data["predicted_rul_months"] > 0
    assert 0.0 <= data["health_score"] <= 100.0
    assert data["risk_level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")
    assert SAFETY_DISCLAIMER in data["safety_disclaimer"]
    assert data["contributing_factors"]["defect_severity_impact_pct"] > 0

    # Test GET latest prediction
    latest_res = client.get(f"/api/v1/prediction/{sample_infrastructure.id}", headers=inspector_headers)
    assert latest_res.status_code == 200
    assert latest_res.json()["data"]["id"] == data["id"]

    # Test GET history
    history_res = client.get(f"/api/v1/prediction/history/{sample_infrastructure.id}", headers=inspector_headers)
    assert history_res.status_code == 200
    assert len(history_res.json()["data"]) >= 1
