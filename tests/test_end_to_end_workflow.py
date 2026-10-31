import io
import cv2
import numpy as np
import pytest


def test_complete_10_step_lifecycle(client):
    """
    Validates the end-to-end user workflow:
    1. Register or log in
    2. Add infrastructure
    3. Upload an inspection image
    4. Run visual defect detection
    5. Submit vibration telemetry
    6. Detect sensor anomalies
    7. Calculate estimated RUL
    8. Generate infrastructure risk assessment
    9. Store the results
    10. Display results through dashboard APIs and geospatial APIs
    """
    # -------------------------------------------------------------
    # Step 1: Register and Log In
    # -------------------------------------------------------------
    reg_payload = {
        "name": "Inspector Marcus Vance",
        "email": "marcus.vance@structura.ai",
        "password": "SecurePassword123!",
        "role": "inspector",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "marcus.vance@structura.ai", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200

    # -------------------------------------------------------------
    # Step 2: Add Infrastructure Asset
    # -------------------------------------------------------------
    infra_payload = {
        "name": "Peninsula Skyway Overpass",
        "infrastructure_type": "overpass",
        "location": "San Mateo, CA",
        "latitude": 37.5630,
        "longitude": -122.3255,
        "construction_year": 1982,
        "material_type": "reinforced_concrete",
    }
    infra_res = client.post("/api/v1/infrastructure/", json=infra_payload, headers=headers)
    assert infra_res.status_code == 201
    infra_id = infra_res.json()["data"]["id"]

    # -------------------------------------------------------------
    # Steps 3 & 4: Upload Inspection Image & Run Visual Defect Detection
    # -------------------------------------------------------------
    # Synthesize image with crack & corrosion
    synthetic_img = np.full((480, 640, 3), 190, dtype=np.uint8)
    cv2.line(synthetic_img, (100, 80), (450, 400), (30, 30, 30), 6)
    cv2.circle(synthetic_img, (320, 240), 60, (20, 60, 160), -1)
    _, encoded = cv2.imencode(".jpg", synthetic_img)

    files = {"file": ("drone_scan_girder_04.jpg", io.BytesIO(encoded.tobytes()), "image/jpeg")}
    form_data = {
        "infrastructure_id": str(infra_id),
        "latitude": "37.5632",
        "longitude": "-122.3258",
    }
    vision_res = client.post("/api/v1/vision/analyze", data=form_data, files=files, headers=headers)
    assert vision_res.status_code == 201
    vision_data = vision_res.json()["data"]
    assert vision_data["defects_detected_count"] >= 1
    assert "processed_image_path" in vision_data

    # -------------------------------------------------------------
    # Steps 5 & 6: Submit Vibration Telemetry & Detect Sensor Anomalies
    # -------------------------------------------------------------
    batch_payload = {
        "infrastructure_id": infra_id,
        "readings": [
            {"sensor_id": "ACCEL-SM-01", "vibration": 1.25, "acceleration": 0.30, "frequency": 7.5},
            {"sensor_id": "ACCEL-SM-01", "vibration": 1.45, "acceleration": 0.35, "frequency": 8.0},
            {"sensor_id": "ACCEL-SM-01", "vibration": 1.60, "acceleration": 0.38, "frequency": 8.2},
            {"sensor_id": "ACCEL-SM-01", "vibration": 10.8, "acceleration": 3.45, "frequency": 38.0},  # Resonance anomaly
        ],
    }
    sensor_res = client.post("/api/v1/sensors/batch", json=batch_payload, headers=headers)
    assert sensor_res.status_code == 201
    sensor_data = sensor_res.json()["data"]
    assert sensor_data["anomalies_detected"] >= 1
    assert sensor_data["summary"]["vibration_peak"] == 10.8

    # -------------------------------------------------------------
    # Step 7: Calculate Estimated Remaining Useful Life (RUL)
    # -------------------------------------------------------------
    rul_payload = {
        "infrastructure_id": infra_id,
        "component_id": "girder_span_3",
        "environmental_condition": "coastal",
        "cyclic_loading_daily_volume": 42000,
    }
    rul_res = client.post("/api/v1/prediction/rul", json=rul_payload, headers=headers)
    assert rul_res.status_code == 201
    rul_data = rul_res.json()["data"]
    assert rul_data["predicted_rul_years"] > 0
    assert 0.0 <= rul_data["health_score"] <= 100.0

    # -------------------------------------------------------------
    # Steps 8 & 9: Generate Infrastructure Risk Assessment & Store Results
    # -------------------------------------------------------------
    risk_res = client.get(f"/api/v1/risk/{infra_id}", headers=headers)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()["data"]
    assert risk_data["infrastructure_id"] == infra_id
    assert risk_data["risk_level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")
    assert len(risk_data["risk_explanation"]) > 0
    assert "DISCLAIMER" in risk_data["engineering_disclaimer"]

    # -------------------------------------------------------------
    # Step 10: Display Results Through Dashboard APIs and Geospatial APIs
    # -------------------------------------------------------------
    # Dashboard Overview
    overview_res = client.get("/api/v1/dashboard/overview", headers=headers)
    assert overview_res.status_code == 200
    overview_data = overview_res.json()["data"]
    assert overview_data["metrics"]["total_infrastructure"] >= 1
    assert overview_data["metrics"]["total_detected_defects"] >= 1
    assert overview_data["metrics"]["active_alerts_count"] >= 1

    # Geospatial FeatureCollection
    geo_res = client.get("/api/v1/geo/infrastructure", headers=headers)
    assert geo_res.status_code == 200
    assert geo_res.json()["data"]["type"] == "FeatureCollection"
    assert len(geo_res.json()["data"]["features"]) >= 1

    # Geospatial Heatmap
    heatmap_res = client.get("/api/v1/geo/heatmap", headers=headers)
    assert heatmap_res.status_code == 200
    assert heatmap_res.json()["data"]["total_points"] >= 1
