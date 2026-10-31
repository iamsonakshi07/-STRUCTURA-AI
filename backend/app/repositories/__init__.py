from backend.app.repositories.base import BaseRepository
from backend.app.repositories.user_repo import UserRepository, user_repo
from backend.app.repositories.infrastructure_repo import InfrastructureRepository, infrastructure_repo
from backend.app.repositories.defect_repo import DefectRepository, defect_repo
from backend.app.repositories.sensor_repo import SensorRepository, sensor_repo
from backend.app.repositories.prediction_repo import PredictionRepository, prediction_repo
from backend.app.repositories.alert_repo import AlertRepository, alert_repo

__all__ = [
    "BaseRepository",
    "UserRepository",
    "user_repo",
    "InfrastructureRepository",
    "infrastructure_repo",
    "DefectRepository",
    "defect_repo",
    "SensorRepository",
    "sensor_repo",
    "PredictionRepository",
    "prediction_repo",
    "AlertRepository",
    "alert_repo",
]
