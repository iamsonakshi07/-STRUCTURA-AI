import pytest
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.prediction import Prediction


@pytest.fixture
def geo_infrastructure_assets(db_session):
    bridge = Infrastructure(
        name="Golden Gate Bridge",
        infrastructure_type="bridge",
        location="San Francisco, CA",
        latitude=37.8199,
        longitude=-122.4783,
        construction_year=1937,
        material_type="steel",
    )
    overpass = Infrastructure(
        name="Silicon Valley Viaduct",
        infrastructure_type="overpass",
        location="San Jose, CA",
        latitude=37.3382,
        longitude=-121.8863,
        construction_year=2005,
        material_type="prestressed_concrete",
    )
    db_session.add_all([bridge, overpass])
    db_session.commit()
    db_session.refresh(bridge)
    db_session.refresh(overpass)

    # Add defect with coordinates
    defect1 = Defect(
        infrastructure_id=bridge.id,
        defect_type="corrosion",
        severity="HIGH",
        confidence=0.92,
        image_path="uploads/gg_corrosion.jpg",
        latitude=37.8205,
        longitude=-122.4788,
    )
    defect2 = Defect(
        infrastructure_id=overpass.id,
        defect_type="crack",
        severity="MODERATE",
        confidence=0.85,
        image_path="uploads/sv_crack.jpg",
        latitude=37.3385,
        longitude=-121.8865,
    )
    db_session.add_all([defect1, defect2])

    # Add prediction for bridge
    pred = Prediction(
        infrastructure_id=bridge.id,
        component_id="main_cable_anchor",
        predicted_rul=18.5,
        risk_level="MODERATE",
        confidence=0.90,
        health_score=72.0,
    )
    db_session.add(pred)
    db_session.commit()

    return {"bridge": bridge, "overpass": overpass}


def test_infrastructure_geojson(client, inspector_headers, geo_infrastructure_assets):
    response = client.get("/api/v1/geo/infrastructure", headers=inspector_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 2

    # Check RFC 7946 compliance: coordinates = [lng, lat]
    first_feat = data["features"][0]
    assert first_feat["type"] == "Feature"
    assert first_feat["geometry"]["type"] == "Point"
    coords = first_feat["geometry"]["coordinates"]
    assert len(coords) == 2
    # Verify longitude is first
    assert coords[0] < -100.0  # West longitude in California
    assert coords[1] > 30.0   # North latitude

    # Properties check
    props = first_feat["properties"]
    assert "health_score" in props
    assert "risk_level" in props
    assert "marker_color" in props
    assert "marker_radius" in props


def test_defects_geojson_and_filtering(client, inspector_headers, geo_infrastructure_assets):
    # 1. Fetch all defects GeoJSON
    response = client.get("/api/v1/geo/defects", headers=inspector_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 2

    # 2. Filter by severity
    high_res = client.get("/api/v1/geo/defects?severity=HIGH", headers=inspector_headers)
    assert high_res.status_code == 200
    high_feats = high_res.json()["data"]["features"]
    assert len(high_feats) >= 1
    for f in high_feats:
        assert f["properties"]["severity"] == "HIGH"


def test_risk_heatmap_endpoint(client, inspector_headers, geo_infrastructure_assets):
    response = client.get("/api/v1/geo/heatmap", headers=inspector_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    assert "points" in data
    assert data["total_points"] >= 2

    first_pt = data["points"][0]
    assert "latitude" in first_pt
    assert "longitude" in first_pt
    assert 0.0 <= first_pt["intensity"] <= 1.0
    assert first_pt["weight"] > 0

    # Bounds check
    bounds = data["bounds"]
    assert bounds["min_latitude"] <= bounds["max_latitude"]
    assert bounds["min_longitude"] <= bounds["max_longitude"]
