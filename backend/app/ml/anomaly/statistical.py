from typing import List, Dict, Any
import numpy as np


def compute_vibration_statistics(readings: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Computes statistical telemetry features from raw vibration readings:
    - Mean
    - Standard Deviation
    - Root Mean Square (RMS)
    - Peak value
    - Crest Factor (Peak / RMS)
    - Dominant Frequency Mean
    """
    if not readings:
        return {
            "vibration_mean": 0.0,
            "vibration_std": 0.0,
            "vibration_rms": 0.0,
            "vibration_peak": 0.0,
            "crest_factor": 0.0,
            "dominant_frequency_mean": 0.0,
        }

    vibrations = np.array([r.get("vibration", 0.0) for r in readings], dtype=float)
    frequencies = np.array([r.get("frequency", 0.0) for r in readings], dtype=float)

    mean_val = float(np.mean(vibrations))
    std_val = float(np.std(vibrations))
    rms_val = float(np.sqrt(np.mean(vibrations**2)))
    peak_val = float(np.max(np.abs(vibrations)))
    crest_factor = float(peak_val / rms_val) if rms_val > 1e-6 else 0.0
    freq_mean = float(np.mean(frequencies))

    return {
        "vibration_mean": round(mean_val, 3),
        "vibration_std": round(std_val, 3),
        "vibration_rms": round(rms_val, 3),
        "vibration_peak": round(peak_val, 3),
        "crest_factor": round(crest_factor, 3),
        "dominant_frequency_mean": round(freq_mean, 2),
    }
