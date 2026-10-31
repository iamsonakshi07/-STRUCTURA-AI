import logging
from typing import Generator, Tuple, Dict, Any, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from backend.app.core.config import settings

logger = logging.getLogger("structura.database")

# Build engine arguments based on database dialect
connect_args: Dict[str, Any] = {}
engine_kwargs: Dict[str, Any] = {
    "pool_pre_ping": True,
    "echo": False,
}

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL Connection Pool Configuration
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
    })

# Initialize primary SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

# Thread-safe session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for all database models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a scoped database session.
    Guarantees clean rollback on error and proper session termination.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as exc:
        logger.error(f"Database session error: {exc}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()


def verify_database_connection(custom_engine=None) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Verifies live database connectivity and returns metadata.
    Returns:
        (is_connected: bool, status_message: str, details: dict)
    """
    target_engine = custom_engine or engine
    details: Dict[str, Any] = {
        "dialect": target_engine.dialect.name,
        "driver": target_engine.driver,
        "pool_size": getattr(target_engine.pool, "size", lambda: 0)(),
        "checked_in_connections": getattr(target_engine.pool, "checkedin", lambda: 0)(),
    }

    try:
        with target_engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            if result == 1:
                return (
                    True,
                    f"Successfully connected to {target_engine.dialect.name.upper()} database",
                    details,
                )
            return (False, "Database probe query returned unexpected result", details)
    except OperationalError as err:
        err_msg = f"OperationalError connecting to {target_engine.dialect.name}: {err.orig or err}"
        logger.warning(err_msg)
        return (False, err_msg, details)
    except Exception as exc:
        err_msg = f"Failed to connect to database: {exc}"
        logger.error(err_msg)
        return (False, err_msg, details)


def init_db(engine_override=None) -> None:
    """
    Creates all declared database tables if they do not exist.
    In production environments, Alembic migrations should be used.
    """
    target_engine = engine_override or engine
    import backend.app.models  # Register all models on Base.metadata
    Base.metadata.create_all(bind=target_engine)
