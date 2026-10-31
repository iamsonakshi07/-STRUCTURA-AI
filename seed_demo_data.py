#!/usr/bin/env python3
"""
Structura AI - Demo Dataset Seeder & Initialization Script.
Prepopulates the database with:
- Admin & Inspector user accounts
- 3 Realistic Infrastructure Assets (Bridge A, Highway Overpass B, Dam C)
- Realistic inspection imagery with OpenCV defect annotations
- Visual defect records (cracks, corrosion, exposed rebar)
- Time-series IoT vibration telemetry & anomaly classifications
- Machine Learning Remaining Useful Life (RUL) predictions
- Multi-factor risk assessments & priority alerts
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
import numpy as np
import cv2

# Set path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from backend.app.core.config import settings
from backend.app.core.database import engine, SessionLocal, Base
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.ml.vision.detector import annotate_image
from backend.app.services.sensors.service import sensor_service
from backend.app.schemas.sensors import SensorBatchCreate, SensorBatchItem
from backend.app.services.prediction.service import prediction_service
from backend.app.schemas.prediction import RULPredictionRequest, EnvironmentalCondition
from backend.app.services.risk.engine import risk_engine


def generate_synthetic_image(output_path: Path, defect_type: str) -> Path:
    """Creates a realistic synthetic concrete / steel structural inspection image using OpenCV."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    width, height = 640, 480

    if defect_type == "corrosion":
        # Steel plate texture with rust/corrosion patch
        img = np.full((height, width, 3), 110, dtype=np.uint8)
        # Add metallic grain
        noise = np.random.normal(0, 15, (height, width, 3)).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        # Paint rust spot (red-orange-brown)
        cv2.circle(img, (320, 240), 90, (20, 65, 170), -1)
        cv2.circle(img, (350, 220), 55, (15, 45, 140), -1)
    else:
        # Concrete texture with jagged crack
        img = np.full((height, width, 3), 195, dtype=np.uint8)
        noise = np.random.normal(0, 18, (height, width, 3)).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        # Jagged crack polyline
        pts = np.array(
            [[120, 80], [210, 160], [280, 240], [360, 310], [420, 410]], np.int32
        ).reshape((-1, 1, 2))
        cv2.polylines(img, [pts], isClosed=False, color=(35, 35, 35), thickness=5)
        # Minor hairline branch crack
        branch = np.array([[280, 240], [330, 200], [390, 185]], np.int32).reshape((-1, 1, 2))
        cv2.polylines(img, [branch], isClosed=False, color=(50, 50, 50), thickness=3)

    cv2.imwrite(str(output_path), img)
    return output_path


def seed_all():
    print("=================================================================")
    print(" STRUCTURA AI - Initializing Database & Seeding Demo Dataset")
    print("=================================================================")

    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        print("\n[1/6] Seeding User Accounts...")
        admin = db.query(User).filter(User.email == "admin@structura.ai").first()
        if not admin:
            admin = User(
                name="Chief Engineer Admin",
                email="admin@structura.ai",
                password_hash=get_password_hash("AdminPass123!"),
                role="admin",
                is_active=True,
            )
            db.add(admin)

        inspector = db.query(User).filter(User.email == "inspector@structura.ai").first()
        if not inspector:
            inspector = User(
                name="Lead Inspector Sarah",
                email="inspector@structura.ai",
                password_hash=get_password_hash("InspectorPass123!"),
                role="inspector",
                is_active=True,
            )
            db.add(inspector)

        db.commit()
        print("  - Admin: admin@structura.ai (password: AdminPass123!)")
        print("  - Inspector: inspector@structura.ai (password: InspectorPass123!)")

        # 2. Seed Infrastructure Assets
        print("\n[2/6] Seeding Primary Infrastructure Assets...")
        assets_data = [
            {
                "name": "Bridge A – Bay Cable-Stayed Viaduct",
                "infrastructure_type": "bridge",
                "location": "San Francisco Bay, CA",
                "latitude": 37.8199,
                "longitude": -122.4783,
                "construction_year": 1965,
                "material_type": "steel",
            },
            {
                "name": "Highway Overpass B – Interstate 90 Concrete Span",
                "infrastructure_type": "overpass",
                "location": "Seattle Metro Area, WA",
                "latitude": 47.6062,
                "longitude": -122.3321,
                "construction_year": 1978,
                "material_type": "reinforced_concrete",
            },
            {
                "name": "Dam C – Cascade Hydroelectric Gravity Dam",
                "infrastructure_type": "dam",
                "location": "Clark County, NV",
                "latitude": 36.0160,
                "longitude": -114.7377,
                "construction_year": 1948,
                "material_type": "reinforced_concrete",
            },
        ]

        seeded_assets = []
        for a_data in assets_data:
            existing = db.query(Infrastructure).filter(Infrastructure.name == a_data["name"]).first()
            if not existing:
                infra = Infrastructure(**a_data)
                db.add(infra)
                db.commit()
                db.refresh(infra)
                seeded_assets.append(infra)
            else:
                seeded_assets.append(existing)

        for a in seeded_assets:
            print(f"  - [{a.id}] {a.name} ({a.infrastructure_type}) in {a.location}")

        # 3. Generate Inspection Images & Detect Defects
        print("\n[3/6] Generating Drone Imagery & Executing Vision Defect Analysis...")
        bridge_a = seeded_assets[0]
        overpass_b = seeded_assets[1]
        dam_c = seeded_assets[2]

        # Generate sample images on disk
        img1 = generate_synthetic_image(settings.UPLOAD_DIR / "bridge_a_corrosion.jpg", "corrosion")
        img2 = generate_synthetic_image(settings.UPLOAD_DIR / "overpass_b_shear_crack.jpg", "crack")
        img3 = generate_synthetic_image(settings.UPLOAD_DIR / "dam_c_spillway_crack.jpg", "crack")

        # Process and record defects
        defects_to_seed = [
            (bridge_a, "corrosion", "HIGH", 0.93, img1, '{"x1": 230, "y1": 150, "x2": 440, "y2": 330}', 37.8205, -122.4788),
            (overpass_b, "crack", "CRITICAL", 0.95, img2, '{"x1": 120, "y1": 80, "x2": 420, "y2": 410}', 47.6068, -122.3328),
            (dam_c, "crack", "HIGH", 0.89, img3, '{"x1": 150, "y1": 100, "x2": 380, "y2": 320}', 36.0164, -114.7381),
            (dam_c, "exposed_reinforcement", "CRITICAL", 0.91, img3, '{"x1": 270, "y1": 210, "x2": 390, "y2": 340}', 36.0166, -114.7385),
        ]

        for infra, def_type, sev, conf, path, bbox, lat, lng in defects_to_seed:
            existing_def = db.query(Defect).filter(
                Defect.infrastructure_id == infra.id,
                Defect.defect_type == def_type,
            ).first()
            if not existing_def:
                proc_name = f"annotated_{path.name}"
                proc_path = settings.PROCESSED_DIR / proc_name

                # Copy and annotate
                shutil_image = cv2.imread(str(path))
                cv2.rectangle(shutil_image, (200, 100), (450, 350), (0, 0, 255), 3)
                cv2.putText(shutil_image, f"[DEMO] {def_type.upper()} ({sev})", (205, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                cv2.imwrite(str(proc_path), shutil_image)

                defect = Defect(
                    infrastructure_id=infra.id,
                    defect_type=def_type,
                    severity=sev,
                    confidence=conf,
                    image_path=f"uploads/{path.name}",
                    processed_image_path=f"processed/{proc_name}",
                    bounding_box=bbox,
                    latitude=lat,
                    longitude=lng,
                )
                db.add(defect)
        db.commit()
        print(f"  - Recorded defects with OpenCV bounding boxes for all 3 assets.")

        # 4. Ingest IoT Vibration Telemetry
        print("\n[4/6] Ingesting IoT Vibration Telemetry & Evaluating Anomalies...")
        for infra in seeded_assets:
            readings_count = db.query(SensorReading).filter(SensorReading.infrastructure_id == infra.id).count()
            if readings_count < 20:
                sensor_id = f"VIB-{infra.infrastructure_type[:3].upper()}-01"
                batch_items = []
                now = datetime.now(timezone.utc)
                # Generate 30 readings
                for i in range(30):
                    ts = now - timedelta(minutes=(30 - i) * 10)
                    if infra.id == dam_c.id and i in (12, 18, 25):
                        # Inject anomalous high vibrations for Dam C
                        vib = float(np.random.uniform(8.5, 13.0))
                        acc = float(np.random.uniform(2.2, 4.0))
                        freq = float(np.random.uniform(28.0, 45.0))
                    else:
                        # Normal dynamic vibration
                        vib = float(np.random.uniform(1.2, 2.8))
                        acc = float(np.random.uniform(0.2, 0.6))
                        freq = float(np.random.uniform(5.0, 14.0))

                    batch_items.append(
                        SensorBatchItem(
                            sensor_id=sensor_id,
                            vibration=round(vib, 2),
                            acceleration=round(acc, 2),
                            frequency=round(freq, 2),
                            timestamp=ts,
                        )
                    )
                sensor_service.record_batch(db, SensorBatchCreate(infrastructure_id=infra.id, readings=batch_items))
        print("  - Streamed 30 vibration telemetry readings per asset with Isolation Forest anomaly tags.")

        # 5. Run RUL Predictions
        print("\n[5/6] Executing ML Remaining Useful Life (RUL) Forecasting...")
        env_map = {
            bridge_a.id: EnvironmentalCondition.COASTAL,
            overpass_b.id: EnvironmentalCondition.URBAN,
            dam_c.id: EnvironmentalCondition.INDUSTRIAL,
        }
        for infra in seeded_assets:
            pred_req = RULPredictionRequest(
                infrastructure_id=infra.id,
                component_id="primary_structural_elements",
                environmental_condition=env_map.get(infra.id, EnvironmentalCondition.URBAN),
                cyclic_loading_daily_volume=35000,
            )
            prediction_service.calculate_and_record_rul(db, pred_req)
        print("  - Calculated physics-informed RUL models and degradation penalties.")

        # 6. Execute Multi-modal Risk Assessments
        print("\n[6/6] Computing Multimodal Risk Index & Dispatching Alerts...")
        print("\n" + "="*80)
        print(f"{'ASSET NAME':<40} | {'HEALTH':<8} | {'RISK':<10} | {'PRIORITY':<16}")
        print("="*80)
        for infra in seeded_assets:
            assessment = risk_engine.assess_infrastructure(db, infra.id)
            print(
                f"{assessment.infrastructure_name[:38]:<40} | "
                f"{assessment.overall_health_score:<8.1f} | "
                f"{assessment.risk_level.value:<10} | "
                f"{assessment.inspection_priority.value:<16}"
            )
        print("="*80)

        # Alerts summary
        active_alerts_cnt = db.query(Alert).filter(Alert.status == "ACTIVE").count()
        print(f"\n Active System Alerts Generated: {active_alerts_cnt}")
        print("\nDemo Data Seeding Completed Successfully! The backend is ready for demonstration.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
