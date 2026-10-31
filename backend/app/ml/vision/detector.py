import os
import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
import cv2
import numpy as np

from backend.app.schemas.vision import BoundingBox, DefectDetectionItem


class BaseVisionDetector(ABC):
    """Abstract interface for structural defect detectors."""

    @abstractmethod
    def detect(self, image_path: str) -> Tuple[List[DefectDetectionItem], str, bool]:
        """
        Process the image and return detected defects.
        Returns:
            - List of DefectDetectionItem
            - detection_engine description
            - is_simulated flag
        """
        pass


class OpenCVDemoVisionDetector(BaseVisionDetector):
    """
    Demo & Heuristic Computer Vision Detector.
    Uses real OpenCV image processing (edge detection, morphological filters,
    and HSV rust/corrosion color segmentation) to detect defect regions,
    explicitly labeled as a DEMO / PROTOTYPE pipeline.
    """

    def detect(self, image_path: str) -> Tuple[List[DefectDetectionItem], str, bool]:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not open or read image file: {image_path}")

        height, width = image.shape[:2]
        defects: List[DefectDetectionItem] = []

        # 1. Edge & Crack Detection via Grayscale + Adaptive Threshold + Contours
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 40, 140)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        dilated = cv2.dilate(edges, kernel, iterations=1)
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Look for elongated contours typical of structural cracks
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 120:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(w) / h if h > 0 else 0
                # If elongated or significant size, mark as crack candidate
                if aspect_ratio > 1.8 or aspect_ratio < 0.55:
                    x1 = max(0, x - 5)
                    y1 = max(0, y - 5)
                    x2 = min(width - 1, x + w + 5)
                    y2 = min(height - 1, y + h + 5)

                    severity = "CRITICAL" if (w * h) > (width * height * 0.05) else "HIGH" if (w * h) > (width * height * 0.02) else "MODERATE"
                    confidence = round(float(np.clip(0.72 + (area / 1000.0) * 0.15, 0.70, 0.94)), 2)

                    defects.append(
                        DefectDetectionItem(
                            defect_type="crack",
                            severity=severity,
                            confidence=confidence,
                            bounding_box=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                            is_simulated=True,
                        )
                    )
                    if len(defects) >= 3:
                        break

        # 2. Rust & Corrosion Detection via HSV Color Thresholding
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        # Rust typically falls into reddish-brown / orange hues
        lower_rust1 = np.array([5, 60, 50])
        upper_rust1 = np.array([22, 255, 200])
        rust_mask = cv2.inRange(hsv, lower_rust1, upper_rust1)

        rust_contours, _ = cv2.findContours(rust_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for r_cnt in rust_contours:
            if cv2.contourArea(r_cnt) > 250:
                rx, ry, rw, rh = cv2.boundingRect(r_cnt)
                rx1 = max(0, rx - 5)
                ry1 = max(0, ry - 5)
                rx2 = min(width - 1, rx + rw + 5)
                ry2 = min(height - 1, ry + rh + 5)

                confidence = round(float(np.clip(0.75 + (cv2.contourArea(r_cnt) / 2000.0), 0.75, 0.96)), 2)
                severity = "HIGH" if (rw * rh) > (width * height * 0.03) else "MODERATE"

                defects.append(
                    DefectDetectionItem(
                        defect_type="corrosion",
                        severity=severity,
                        confidence=confidence,
                        bounding_box=BoundingBox(x1=rx1, y1=ry1, x2=rx2, y2=ry2),
                        is_simulated=True,
                    )
                )
                if len(defects) >= 5:
                    break

        # If image was clean or synthetic without contours, provide standard prototype defect detection
        if not defects:
            # Deterministic default demo defect based on image center
            cx, cy = width // 2, height // 2
            defects.append(
                DefectDetectionItem(
                    defect_type="crack",
                    severity="HIGH",
                    confidence=0.88,
                    bounding_box=BoundingBox(
                        x1=max(0, cx - int(width * 0.15)),
                        y1=max(0, cy - int(height * 0.1)),
                        x2=min(width - 1, cx + int(width * 0.15)),
                        y2=min(height - 1, cy + int(height * 0.1)),
                    ),
                    is_simulated=True,
                )
            )

        return (
            defects,
            "OpenCV Heuristic + Synthetic Prototype Defect Detector (DEMO MODE)",
            True,
        )


class YOLOv8VisionDetector(BaseVisionDetector):
    """
    YOLOv8 deep learning defect detector.
    Attempts to load a trained weights file; if weights are not provided,
    falls back cleanly to OpenCVDemoVisionDetector with explicit demo disclosure.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or "models/yolov8_defects.pt"
        self.yolo_model = None
        self._fallback_detector = OpenCVDemoVisionDetector()

        if Path(self.model_path).exists():
            try:
                from ultralytics import YOLO
                self.yolo_model = YOLO(self.model_path)
            except Exception as e:
                self.yolo_model = None

    def detect(self, image_path: str) -> Tuple[List[DefectDetectionItem], str, bool]:
        if self.yolo_model is None:
            # Clean fallback to demo mode
            return self._fallback_detector.detect(image_path)

        # Run inference using trained YOLOv8 model
        results = self.yolo_model.predict(source=image_path, conf=0.35, verbose=False)
        defects: List[DefectDetectionItem] = []

        class_map = {0: "crack", 1: "corrosion", 2: "exposed_reinforcement", 3: "spalling"}

        for result in results:
            boxes = result.boxes
            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy()
                cls_id = int(box.cls[0].cpu().numpy())
                conf = float(box.conf[0].cpu().numpy())

                defect_name = class_map.get(cls_id, "crack")
                severity = "CRITICAL" if conf > 0.85 else "HIGH" if conf > 0.70 else "MODERATE"

                defects.append(
                    DefectDetectionItem(
                        defect_type=defect_name,
                        severity=severity,
                        confidence=round(conf, 2),
                        bounding_box=BoundingBox(
                            x1=int(xyxy[0]),
                            y1=int(xyxy[1]),
                            x2=int(xyxy[2]),
                            y2=int(xyxy[3]),
                        ),
                        is_simulated=False,
                    )
                )

        if not defects:
            # If no YOLO predictions on un-fine-tuned weights, utilize fallback
            return self._fallback_detector.detect(image_path)

        return (defects, "YOLOv8 Production Deep Learning Model", False)


def annotate_image(
    image_path: str,
    output_path: str,
    defects: List[DefectDetectionItem],
    is_demo_mode: bool = True,
) -> str:
    """
    Renders high-contrast bounding boxes, defect labels, severity indicators,
    and a diagnostic header watermark on the input image.
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not read image: {image_path}")

    color_palette = {
        "CRITICAL": (0, 0, 230),     # Red
        "HIGH": (0, 100, 255),       # Orange/Red
        "MODERATE": (0, 215, 255),   # Yellow
        "LOW": (0, 220, 0),          # Green
    }

    height, width = image.shape[:2]

    for d in defects:
        bbox = d.bounding_box
        color = color_palette.get(d.severity.upper(), (0, 255, 255))

        # Draw defect bounding box
        cv2.rectangle(image, (bbox.x1, bbox.y1), (bbox.x2, bbox.y2), color, 3)

        # Label text
        sim_tag = "[DEMO]" if d.is_simulated else "[AI-LIVE]"
        label = f"{sim_tag} {d.defect_type.upper()} ({d.severity}) {int(d.confidence * 100)}%"

        (text_w, text_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        top = max(bbox.y1, text_h + 10)
        cv2.rectangle(
            image,
            (bbox.x1, top - text_h - 8),
            (bbox.x1 + text_w + 10, top + baseline),
            color,
            cv2.FILLED,
        )
        cv2.putText(
            image,
            label,
            (bbox.x1 + 5, top - 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 0, 0),
            2,
            cv2.LINE_AA,
        )

    # Top banner overlay
    banner_color = (30, 30, 30)
    banner_height = 40
    cv2.rectangle(image, (0, 0), (width, banner_height), banner_color, cv2.FILLED)

    mode_text = "STRUCTURA AI - VISION DEFECT ENGINE [DEMO PROTOTYPE MODE]" if is_demo_mode else "STRUCTURA AI - VISION DEFECT ENGINE [ACTIVE YOLOv8]"
    cv2.putText(
        image,
        mode_text,
        (15, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 220, 255) if is_demo_mode else (0, 255, 0),
        2,
        cv2.LINE_AA,
    )

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(output_path, image)
    return output_path
