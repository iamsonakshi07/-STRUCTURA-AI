from typing import Tuple, List, Dict, Any
import numpy as np
from sklearn.ensemble import IsolationForest


class VibrationIsolationForestDetector:
    """
    Isolation Forest anomaly detector for IoT structural vibration telemetry.
    Detects irregular high-energy oscillations, resonance spikes, and abnormal frequencies.
    """

    def __init__(self, contamination: float = 0.08):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42,
        )
        self._fit_baseline_distribution()

    def _fit_baseline_distribution(self):
        """Fit the model on a simulated baseline distribution of standard structural vibration."""
        np.random.seed(42)
        n_samples = 1500

        # Normal operational distribution for concrete/steel infrastructure:
        # Vibration: 0.8 - 3.2 mm/s RMS
        # Acceleration: 0.1 - 0.75 m/s^2
        # Dominant frequency: 3.0 - 15.0 Hz
        norm_vibration = np.random.normal(loc=1.8, scale=0.6, size=n_samples)
        norm_vibration = np.clip(norm_vibration, 0.4, 3.8)

        norm_acceleration = np.random.normal(loc=0.4, scale=0.15, size=n_samples)
        norm_acceleration = np.clip(norm_acceleration, 0.05, 0.85)

        norm_frequency = np.random.normal(loc=8.5, scale=2.5, size=n_samples)
        norm_frequency = np.clip(norm_frequency, 2.0, 16.0)

        # Small percentage of synthetic anomalies in baseline training
        n_anom = int(n_samples * self.contamination)
        anom_vib = np.random.uniform(5.5, 14.0, size=n_anom)
        anom_acc = np.random.uniform(1.2, 4.0, size=n_anom)
        anom_freq = np.random.uniform(22.0, 45.0, size=n_anom)

        all_vib = np.concatenate([norm_vibration, anom_vib])
        all_acc = np.concatenate([norm_acceleration, anom_acc])
        all_freq = np.concatenate([norm_frequency, anom_freq])

        X = np.column_stack([all_vib, all_acc, all_freq])
        self.model.fit(X)

    def predict_single(
        self, vibration: float, acceleration: float, frequency: float
    ) -> Tuple[bool, float]:
        """
        Evaluate a single telemetry point.
        Returns:
            - is_anomaly (bool)
            - anomaly_score (float: negative values represent anomalies, lower = more severe)
        """
        X = np.array([[vibration, acceleration, frequency]])
        pred = self.model.predict(X)[0]  # 1 = normal, -1 = anomaly
        raw_score = float(self.model.decision_function(X)[0])

        is_anomaly = bool(pred == -1 or vibration > 5.5 or acceleration > 2.0)
        return is_anomaly, round(raw_score, 4)

    def predict_batch(
        self, features: np.ndarray
    ) -> Tuple[List[bool], List[float]]:
        """
        Evaluate a batch of telemetry rows (shape: N x 3).
        Returns:
            - List of is_anomaly booleans
            - List of anomaly scores
        """
        preds = self.model.predict(features)
        scores = self.model.decision_function(features)

        is_anomalies = []
        for i, pred in enumerate(preds):
            vib = features[i, 0]
            acc = features[i, 1]
            flag = bool(pred == -1 or vib > 5.5 or acc > 2.0)
            is_anomalies.append(flag)

        anomaly_scores = [round(float(s), 4) for s in scores]
        return is_anomalies, anomaly_scores


# Global singleton detector
isolation_forest_detector = VibrationIsolationForestDetector()
