import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base, get_db
from backend.app.main import app

# In-memory SQLite with StaticPool so all connections share the same memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_register_user_success():
    payload = {
        "name": "Jane Inspector",
        "email": "jane@structura.ai",
        "password": "Password123!",
        "role": "inspector",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "jane@structura.ai"
    assert data["data"]["user"]["role"] == "inspector"


def test_register_duplicate_email():
    payload = {
        "name": "Jane Inspector",
        "email": "jane@structura.ai",
        "password": "Password123!",
        "role": "inspector",
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 400
    data = resp2.json()
    assert data["success"] is False
    assert "already exists" in data["message"]


def test_login_success_and_failure():
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alex Engineer",
            "email": "alex@structura.ai",
            "password": "CorrectPassword!",
            "role": "inspector",
        },
    )

    # Correct login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "alex@structura.ai", "password": "CorrectPassword!"},
    )
    assert login_resp.status_code == 200
    assert login_resp.json()["success"] is True
    token = login_resp.json()["data"]["access_token"]
    assert token is not None

    # Incorrect login
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "alex@structura.ai", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401
    assert bad_login.json()["success"] is False


def test_protected_routes_and_rbac():
    # Register Inspector
    insp_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Inspector Bob",
            "email": "bob@structura.ai",
            "password": "SecretPassword1",
            "role": "inspector",
        },
    )
    insp_token = insp_res.json()["data"]["access_token"]
    insp_headers = {"Authorization": f"Bearer {insp_token}"}

    # Register Admin
    admin_res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin Alice",
            "email": "admin@structura.ai",
            "password": "AdminPassword1",
            "role": "admin",
        },
    )
    admin_token = admin_res.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify /me endpoint
    me_res = client.get("/api/v1/auth/me", headers=insp_headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "bob@structura.ai"

    # Inspector accessing admin-only endpoint should be forbidden (403)
    admin_only_fail = client.get("/api/v1/auth/admin-only", headers=insp_headers)
    assert admin_only_fail.status_code == 403

    # Admin accessing admin-only endpoint should succeed (200)
    admin_only_ok = client.get("/api/v1/auth/admin-only", headers=admin_headers)
    assert admin_only_ok.status_code == 200

    # Inspector accessing inspector-only endpoint should succeed (200)
    insp_only_ok = client.get("/api/v1/auth/inspector-only", headers=insp_headers)
    assert insp_only_ok.status_code == 200

    # Unauthenticated request should fail (401)
    unauth = client.get("/api/v1/auth/me")
    assert unauth.status_code == 401
