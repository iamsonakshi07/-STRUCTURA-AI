from datetime import datetime, timezone
from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    """Standardized API response format for all Structura AI endpoints."""
    success: bool = Field(True, description="Indicates whether the request was successful")
    message: str = Field("Operation completed successfully", description="User-facing status message")
    data: Optional[DataT] = Field(None, description="Payload data returned by the endpoint")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 UTC timestamp of response generation",
    )


def response_success(data: Any = None, message: str = "Operation completed successfully") -> dict:
    """Helper for returning uniform success responses."""
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def response_error(message: str = "An error occurred", data: Any = None) -> dict:
    """Helper for returning uniform error responses."""
    return {
        "success": False,
        "message": message,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
