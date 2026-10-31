import io
from pathlib import Path
import numpy as np
import cv2
import pytest
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.alert import Alert


@pytest.fixture
def sample_infrastructure(db_session):
    infra = Infrastructure(
        name="Suspension Bridge East Tower",
        infrastructure_type="bridge",
        location="Seattle, WA",
        latitude=47.6062,
        longitude=-122.3321,
        construction_year=1962,
        material_type="reinforced_concrete",
    )
    db_session.add(infra)
    db_session.commit()
    db_session.refresh(infra)
    return infra


@pytest.fixture
def synthetic_concrete_crack_image():
    """Generates an in-memory 400x400 concrete surface image with dark crack-like lines."""
    # Gray concrete texture
    img = np.full((400, 400, 3), 180, dtype=np.uint8)
    # Add crack: jagged dark line
    pts = np.array([[50, 60], [120, 110], [180, 190], [240, 290], [320, 340]], np.int32)
    pts = pts.reshape((-1, 1, 2))
    cv2.polylines(img, [pts], isClosed=False, color=(30, 30, 30), thickness=4)
    # Add corrosion patch: orange-brown rust spot
    cv2.circle(img, (280, 120), 30, (25, 75, 175), -1)

    # Encode as JPEG
    _, encoded = cv2.imencode(".jpg", img)
    return encoded.tobytes()


def test_invalid_image_extension(client, inspector_headers, sample_infrastructure):
    file_content = b"Not a real image file"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {"infrastructure_id": str(sample_infrastructure.id)}

    response = client.post("/api/v1/vision/analyze", data=data, files=files, headers=inspector_headers)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["message"]


def test_vision_analysis_pipeline_and_alerts(
    client, inspector_headers, sample_infrastructure, synthetic_concrete_crack_image, db_session
):
    files = {"file": ("concrete_pier.jpg", io.BytesIO(synthetic_concrete_crack_image), "image/jpeg")}
    data = {
        "infrastructure_id": str(sample_infrastructure.id),
        "latitude": "47.6065",
        "longitude": "-122.3325",
    }

    response = client.post("/api/v1/vision/analyze", data=data, files=files, headers=inspector_headers)
    assert response.status_code == 201
    res_data = response.json()["data"]

    assert res_data["infrastructure_id"] == sample_infrastructure.id
    assert res_data["defects_detected_count"] >= 1
    assert "processed_image_path" in res_data
    assert res_data["is_simulated_mode"] is True  # Clearly declared demo fallback
    assert len(res_data["defects"]) >= 1

    first_defect = res_data["defects"][0]
    defect_id = first_defect["id"]
    assert defect_id is not None
    assert first_defect["defect_type"] in ("crack", "corrosion", "exposed_reinforcement")
    assert first_defect["confidence"] > 0.0

    # Verify defect was saved in database
    db_defect = db_session.query(Defect).filter(Defect.id == defect_id).first()
    assert db_defect is not None
    assert db_defect.infrastructure_id == sample_infrastructure.id

    # Verify alert was created in database
    alert = db_session.query(Alert).filter(Alert.infrastructure_id == sample_infrastructure.id).first()
    assert alert is not None
    assert alert.alert_type == "DEFECT_DETECTED"

    # Test GET /results/{id}
    result_res = client.get(f"/api/v1/vision/results/{defect_id}", headers=inspector_headers)
    assert result_res.status_code == 200
    assert result_res.json()["data"]["id"] == defect_id

    # Test GET /infrastructure/{id}
    infra_defects_res = client.get(f"/api/v1/vision/infrastructure/{sample_infrastructure.id}", headers=inspector_headers)
    assert infra_defects_res.status_code == 200
    assert len(infra_defects_res.json()["data"]) >= 1
