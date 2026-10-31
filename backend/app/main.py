from datetime import datetime, timezone
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, verify_database_connection, init_db
import backend.app.models  # load all models into Base
from backend.app.websocket.manager import ws_manager
from backend.app.api.routes import (
    auth,
    infrastructure,
    vision,
    sensors,
    prediction,
    risk,
    geospatial,
    dashboard,
)

# Attempt safe schema initialization if target database is reachable
try:
    init_db()
except Exception as _e:
    import logging
    logging.getLogger("structura.startup").warning(
        f"Database connection check during startup: {_e}. "
        "Proceeding startup; ensure PostgreSQL is running or verify with /health."
    )

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS configuration
_cors_origins = [str(o).strip() for o in settings.BACKEND_CORS_ORIGINS if o]
_has_wildcard = "*" in _cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=not _has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers for standard response format
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "data": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [{"loc": err["loc"], "msg": err["msg"], "type": err["type"]} for err in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error in request payload",
            "data": {"errors": errors},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.get("/", tags=["Health"])
def root():
    return {
        "success": True,
        "message": f"Welcome to {settings.PROJECT_NAME} Backend API",
        "data": {
            "version": settings.VERSION,
            "docs": f"{settings.API_V1_STR}/docs",
            "status": "online",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["Health"])
def health_check():
    db_connected, db_msg, db_details = verify_database_connection()
    return {
        "success": True,
        "message": "System operational" if db_connected else "System operational (database disconnected)",
        "data": {
            "status": "healthy" if db_connected else "degraded",
            "database": "connected" if db_connected else "disconnected",
            "database_message": db_msg,
            "database_details": db_details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(infrastructure.router, prefix=settings.API_V1_STR)
app.include_router(vision.router, prefix=settings.API_V1_STR)
app.include_router(sensors.router, prefix=settings.API_V1_STR)
app.include_router(prediction.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(geospatial.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

# Static file serving for inspection images
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/processed", StaticFiles(directory=str(settings.PROCESSED_DIR)), name="processed")


@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time alert broadcasts.
    Frontend dashboards connect here to receive instant push alerts for critical defects or sensor anomalies.
    """
    await ws_manager.connect(websocket)
    try:
        # Send greeting connection payload
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to Structura AI live telemetry & alert stream",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        while True:
            # Keep connection open and receive any client ping messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
