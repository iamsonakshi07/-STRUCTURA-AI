#!/usr/bin/env python3
"""
STRUCTURA AI - Database Seeding & Initialization Script.
Prepopulates the PostgreSQL database with realistic structural health data:
- User accounts (Admin & Inspector)
- Primary infrastructure assets (Bridge A, Overpass B, Dam C)
- Localized defect records across all 4 categories (Crack, Corrosion, Rebar Exposure, Foundation Shift)
- IoT vibration telemetry time-series & anomaly classifications
- Physics-informed Remaining Useful Life (RUL) predictions
- Multi-factor risk assessments & active system alerts

Guarantees:
- Fully idempotent: avoids duplicate entries on repeated runs.
- Distinguishes demo/simulated records with [DEMO] tags.
- Never overwrites existing user records or custom passwords.
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
import numpy as np
import cv2

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.core.config import settings
from backend.app.core.database import engine, SessionLocal, init_db, verify_database_connection
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.sensor import SensorReading
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.services.sensors.service import sensor_service
from backend.app.schemas.sensors import SensorBatchCreate, SensorBatchItem
from backend.app.services.prediction.service import prediction_service
from backend.app.schemas.prediction import RULPredictionRequest, EnvironmentalCondition
from backend.app.services.risk.engine import risk_engine


def generate_synthetic_image(output_path: Path, defect_type: str) -> Path:
    """Generates a realistic synthetic structural inspection image on disk."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    width, height = 640, 480

    if defect_type == "corrosion":
        img = np.full((height, width, 3), 110, dtype=np.uint8)
        noise = np.random.normal(0, 15, (height, width, 3)).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        cv2.circle(img, (320, 240), 90, (20, 65, 170), -1)
        cv2.circle(img, (350, 220), 55, (15, 45, 140), -1)
    elif defect_type == "rebar_exposure":
        img = np.full((height, width, 3), 160, dtype=np.uint8)
        noise = np.random.normal(0, 12, (height, width, 3)).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        # Concrete spall cavity
        cv2.ellipse(img, (320, 240), (120, 70), 0, 0, 360, (70, 70, 70), -1)
        # Parallel ribbed metallic rebar
        for y_pos in range(210, 280, 20):
            cv2.line(img, (220, y_pos), (420, y_pos), (30, 80, 140), 6)
    elif defect_type == "foundation_shift":
        img = np.full((height, width, 3), 180, dtype=np.uint8)
        noise = np.random.normal(0, 10, (height, width, 3)).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        # Foundation settlement step line
        cv2.line(img, (40, 340), (280, 340), (40, 40, 40), 4)
        cv2.line(img, (280, 340), (300, 375), (30, 30, 30), 4)
        cv2.line(img, (300, 375), (600, 375), (40, 40, 40), 4)
    else:
        # Concrete crack
        img = np.full((height, width, 3), 195, dtype=np.uint8)
        noise = np.random.normal(0, 18, (height, width, 3)).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        pts = np.array(
            [[120, 80], [210, 160], [280, 240], [360, 310], [420, 410]], np.int32
        ).reshape((-1, 1, 2))
        cv2.polylines(img, [pts], isClosed=False, color=(35, 35, 35), thickness=5)
        branch = np.array([[280, 240], [330, 200], [390, 185]], np.int32).reshape((-1, 1, 2))
        cv2.polylines(img, [branch], isClosed=False, color=(50, 50, 50), thickness=3)

    cv2.imwrite(str(output_path), img)
    return output_path


def seed_all():
    print("=================================================================")
    print(" STRUCTURA AI - Initializing PostgreSQL Database & Seeding Dataset")
    print(f" Target URL: {settings.DATABASE_URL}")
    print("=================================================================")

    # Verify connectivity before proceeding
    is_connected, msg, details = verify_database_connection()
    if not is_connected:
        print(f"\n[WARNING] Database connectivity check failed: {msg}")
        print("Please ensure PostgreSQL is running and credentials in .env are correct.")
        print("Attempting schema initialization with current configuration...")

    # Ensure tables exist
    try:
        init_db()
        print("✓ Database tables verified / created.")
    except Exception as exc:
        print(f"✗ Failed to verify database schema: {exc}")
        return False

    db = SessionLocal()

    try:
        # 1. Seed Users (never overwrite existing accounts)
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
            print("  + Created Admin: admin@structura.ai (password: AdminPass123!)")
        else:
            print("  ✓ Admin account already exists (preserved).")

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
            print("  + Created Inspector: inspector@structura.ai (password: InspectorPass123!)")
        else:
            print("  ✓ Inspector account already exists (preserved).")

        db.commit()

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
                print(f"  + Added: [{infra.id}] {infra.name} ({infra.infrastructure_type})")
            else:
                seeded_assets.append(existing)
                print(f"  ✓ Preserved: [{existing.id}] {existing.name}")

        bridge_a = seeded_assets[0]
        overpass_b = seeded_assets[1]
        dam_c = seeded_assets[2]

        # 3. Seed Drone Imagery & Defect Detections across all 4 categories
        print("\n[3/6] Seeding AI Defect Detections (4 Defect Categories)...")
        img_corr = generate_synthetic_image(settings.UPLOAD_DIR / "bridge_a_corrosion.jpg", "corrosion")
        img_crack = generate_synthetic_image(settings.UPLOAD_DIR / "overpass_b_crack.jpg", "crack")
        img_rebar = generate_synthetic_image(settings.UPLOAD_DIR / "dam_c_rebar.jpg", "rebar_exposure")
        img_shift = generate_synthetic_image(settings.UPLOAD_DIR / "dam_c_settlement.jpg", "foundation_shift")

        defects_to_seed = [
            (bridge_a, "corrosion", "HIGH", 0.93, img_corr, '{"x1": 230, "y1": 150, "x2": 440, "y2": 330}', 37.8205, -122.4788),
            (overpass_b, "crack", "CRITICAL", 0.96, img_crack, '{"x1": 120, "y1": 80, "x2": 420, "y2": 410}', 47.6068, -122.3328),
            (dam_c, "rebar_exposure", "CRITICAL", 0.94, img_rebar, '{"x1": 220, "y1": 210, "x2": 420, "y2": 350}', 36.0166, -114.7385),
            (dam_c, "foundation_shift", "HIGH", 0.88, img_shift, '{"x1": 60, "y1": 330, "x2": 580, "y2": 440}', 36.0162, -114.7380),
        ]

        # Category colors (BGR)
        category_bgr = {
            "crack": (68, 68, 239),           # Red
            "corrosion": (22, 115, 249),       # Orange
            "rebar_exposure": (8, 179, 234),   # Yellow
            "foundation_shift": (247, 85, 168),# Purple
        }

        for infra, def_type, sev, conf, path, bbox, lat, lng in defects_to_seed:
            existing_def = db.query(Defect).filter(
                Defect.infrastructure_id == infra.id,
                Defect.defect_type == def_type,
            ).first()
            if not existing_def:
                proc_name = f"annotated_{path.name}"
                proc_path = settings.PROCESSED_DIR / proc_name

                # Render annotated defect image
                ann_img = cv2.imread(str(path))
                color = category_bgr.get(def_type, (68, 68, 239))
                cv2.rectangle(ann_img, (180, 100), (460, 360), color, 3)
                cv2.putText(
                    ann_img,
                    f"[DEMO] {def_type.replace('_', ' ').upper()} ({sev}) {int(conf * 100)}%",
                    (185, 90),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    color,
                    2,
                )
                cv2.imwrite(str(proc_path), ann_img)

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
                print(f"  + Recorded defect: {def_type.upper()} ({sev}) on {infra.name[:25]}")
            else:
                print(f"  ✓ Preserved defect: {def_type.upper()} on {infra.name[:25]}")

        db.commit()

        # 4. Ingest IoT Vibration Telemetry
        print("\n[4/6] Ingesting IoT Vibration Telemetry (Idempotent)...")
        for infra in seeded_assets:
            readings_count = db.query(SensorReading).filter(SensorReading.infrastructure_id == infra.id).count()
            if readings_count < 30:
                sensor_id = f"VIB-{infra.infrastructure_type[:3].upper()}-01-DEMO"
                batch_items = []
                now = datetime.now(timezone.utc)
                for i in range(30):
                    ts = now - timedelta(minutes=(30 - i) * 10)
                    if infra.id == dam_c.id and i in (12, 18, 25):
                        vib = float(np.random.uniform(8.5, 13.0))
                        acc = float(np.random.uniform(2.2, 4.0))
                        freq = float(np.random.uniform(28.0, 45.0))
                    else:
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
                print(f"  + Ingested 30 telemetry points for {infra.name[:25]}")
            else:
                print(f"  ✓ Telemetry points already exist ({readings_count}) for {infra.name[:25]}")

        # 5. Run ML Remaining Useful Life (RUL) Predictions
        print("\n[5/6] Executing ML Remaining Useful Life (RUL) Forecasting...")
        env_map = {
            bridge_a.id: EnvironmentalCondition.COASTAL,
            overpass_b.id: EnvironmentalCondition.URBAN,
            dam_c.id: EnvironmentalCondition.INDUSTRIAL,
        }
        for infra in seeded_assets:
            existing_pred = (
                db.query(Prediction)
                .filter(Prediction.infrastructure_id == infra.id)
                .first()
            )
            if not existing_pred:
                pred_req = RULPredictionRequest(
                    infrastructure_id=infra.id,
                    component_id="primary_structural_elements",
                    environmental_condition=env_map.get(infra.id, EnvironmentalCondition.URBAN),
                    cyclic_loading_daily_volume=35000,
                )
                prediction_service.calculate_and_record_rul(db, pred_req)
                print(f"  + Calculated RUL prediction for {infra.name[:25]}")
            else:
                print(f"  ✓ RUL prediction already recorded for {infra.name[:25]}")

        # 6. Execute Multi-modal Risk Assessments & Alerts
        print("\n[6/6] Computing Multimodal Risk Index & Dispatching Alerts...")
        print("\n" + "=" * 80)
        print(f"{'ASSET NAME':<40} | {'HEALTH':<8} | {'RISK':<10} | {'PRIORITY':<16}")
        print("=" * 80)
        for infra in seeded_assets:
            assessment = risk_engine.assess_infrastructure(db, infra.id)
            print(
                f"{assessment.infrastructure_name[:38]:<40} | "
                f"{assessment.overall_health_score:<8.1f} | "
                f"{assessment.risk_level.value:<10} | "
                f"{assessment.inspection_priority.value:<16}"
            )
        print("=" * 80)

        active_alerts_cnt = db.query(Alert).filter(Alert.status == "ACTIVE").count()
        print(f"\n Active System Alerts in PostgreSQL: {active_alerts_cnt}")
        print("\n✓ Database Seeding Completed Successfully! STRUCTURA AI is ready.")
        return True

    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
