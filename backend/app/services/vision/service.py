import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple
import cv2
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.ml.vision.detector import YOLOv8VisionDetector, annotate_image
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.defect import Defect
from backend.app.models.alert import Alert
from backend.app.schemas.vision import (
    VisionAnalysisResponse,
    DefectDetectionItem,
    BoundingBox,
)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


class VisionService:
    def __init__(self):
        self.detector = YOLOv8VisionDetector(model_path=settings.YOLO_MODEL_PATH)

    def validate_image(self, file: UploadFile) -> str:
        """Validate format and file extension."""
        filename = file.filename or ""
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Only JPG, JPEG, and PNG images are allowed.",
            )
        return ext

    async def analyze_and_record(
        self,
        db: Session,
        infrastructure_id: int,
        file: UploadFile,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> VisionAnalysisResponse:
        """Process an uploaded inspection image, run defect detection, save outputs, and record to DB."""
        # Check that infrastructure exists
        infra = db.query(Infrastructure).filter(Infrastructure.id == infrastructure_id).first()
        if not infra:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Infrastructure asset with id {infrastructure_id} not found.",
            )

        ext = self.validate_image(file)

        # Generate unique filenames
        unique_id = uuid.uuid4().hex[:10]
        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        orig_filename = f"infra_{infrastructure_id}_{timestamp_str}_{unique_id}{ext}"
        proc_filename = f"annotated_infra_{infrastructure_id}_{timestamp_str}_{unique_id}{ext}"

        orig_path = settings.UPLOAD_DIR / orig_filename
        proc_path = settings.PROCESSED_DIR / proc_filename

        # Stream save file to disk with size check
        size = 0
        with open(orig_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    if orig_path.exists():
                        orig_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB.",
                    )
                buffer.write(chunk)

        # Read image to verify and retrieve dimensions
        img = cv2.imread(str(orig_path))
        if img is None:
            if orig_path.exists():
                orig_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is corrupted or not a valid image.",
            )

        height, width = img.shape[:2]

        # Run Defect Detection
        detected_items, engine_name, is_simulated = self.detector.detect(str(orig_path))

        # Annotate image
        annotate_image(
            image_path=str(orig_path),
            output_path=str(proc_path),
            defects=detected_items,
            is_demo_mode=is_simulated,
        )

        # Persist defects to DB
        defect_entities = []
        for d in detected_items:
            bbox_json = json.dumps(d.bounding_box.model_dump())
            defect_obj = Defect(
                infrastructure_id=infrastructure_id,
                defect_type=d.defect_type,
                severity=d.severity,
                confidence=d.confidence,
                image_path=str(orig_path.relative_to(settings.BASE_DIR)),
                processed_image_path=str(proc_path.relative_to(settings.BASE_DIR)),
                bounding_box=bbox_json,
                latitude=latitude if latitude is not None else infra.latitude,
                longitude=longitude if longitude is not None else infra.longitude,
            )
            db.add(defect_obj)
            defect_entities.append(defect_obj)

        db.commit()

        # Update defect IDs in output response items
        for idx, defect_obj in enumerate(defect_entities):
            db.refresh(defect_obj)
            detected_items[idx].id = defect_obj.id

        # Trigger alert if defects detected
        if detected_items:
            defect_types_str = ", ".join(set(d.defect_type for d in detected_items))
            highest_sev = (
                "CRITICAL" if any(d.severity == "CRITICAL" for d in detected_items)
                else "HIGH" if any(d.severity == "HIGH" for d in detected_items)
                else "MODERATE"
            )
            alert_msg = f"Visual defect alert on {infra.name}: detected {len(detected_items)} defect(s) ({defect_types_str}) with severity {highest_sev}."

            alert = Alert(
                infrastructure_id=infrastructure_id,
                alert_type="DEFECT_DETECTED",
                severity=highest_sev,
                message=alert_msg,
                status="ACTIVE",
            )
            db.add(alert)
            db.commit()

        return VisionAnalysisResponse(
            infrastructure_id=infrastructure_id,
            image_filename=orig_filename,
            original_image_path=str(orig_path.relative_to(settings.BASE_DIR)),
            processed_image_path=str(proc_path.relative_to(settings.BASE_DIR)),
            image_width=width,
            image_height=height,
            defects_detected_count=len(detected_items),
            defects=detected_items,
            detection_engine=engine_name,
            is_simulated_mode=is_simulated,
            analyzed_at=datetime.now(timezone.utc),
        )


vision_service = VisionService()
