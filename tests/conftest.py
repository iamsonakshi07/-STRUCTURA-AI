import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base, get_db
from backend.app.core.security import create_access_token, get_password_hash
from backend.app.models.user import User
from backend.app.main import app

# Shared test database across test suite
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def init_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        # Prepopulate standard test users
        admin = User(
            name="Admin User",
            email="admin@structura.ai",
            password_hash=get_password_hash("AdminPass123!"),
            role="admin",
            is_active=True,
        )
        inspector = User(
            name="Inspector Bob",
            email="bob@structura.ai",
            password_hash=get_password_hash("InspectorPass123!"),
            role="inspector",
            is_active=True,
        )
        db.add_all([admin, inspector])
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_token(db_session):
    admin = db_session.query(User).filter(User.email == "admin@structura.ai").first()
    return create_access_token(subject=admin.id, role=admin.role)


@pytest.fixture
def inspector_token(db_session):
    inspector = db_session.query(User).filter(User.email == "bob@structura.ai").first()
    return create_access_token(subject=inspector.id, role=inspector.role)


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def inspector_headers(inspector_token):
    return {"Authorization": f"Bearer {inspector_token}"}
