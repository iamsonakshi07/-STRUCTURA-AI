from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.api.deps import get_current_user, require_roles
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from backend.app.models.user import User
from backend.app.repositories import user_repo
from backend.app.schemas.auth import UserCreate, UserLogin, UserResponse, TokenResponse
from backend.app.schemas.common import APIResponse, response_success

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with role-based access."""
    existing_user = user_repo.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = user_repo.create_user(
        db,
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role),
    )

    token = create_access_token(subject=user.id, role=user.role)
    user_data = UserResponse.model_validate(user)

    return response_success(
        data={"access_token": token, "token_type": "bearer", "user": user_data.model_dump()},
        message="User successfully registered",
    )


@router.post("/login", response_model=APIResponse[TokenResponse])
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT bearer token."""
    user = user_repo.get_by_email(db, email=login_data.email)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    token = create_access_token(subject=user.id, role=user.role)
    user_data = UserResponse.model_validate(user)

    return response_success(
        data={"access_token": token, "token_type": "bearer", "user": user_data.model_dump()},
        message="Login successful",
    )


@router.get("/me", response_model=APIResponse[UserResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Fetch the authenticated user's profile."""
    user_data = UserResponse.model_validate(current_user)
    return response_success(data=user_data.model_dump(), message="Profile retrieved successfully")


@router.get("/admin-only", response_model=APIResponse[dict])
def admin_only_check(current_user: User = Depends(require_roles("admin"))):
    """Test RBAC enforcement: Admin role only."""
    return response_success(
        data={"user": current_user.email, "role": current_user.role},
        message="Admin access verified successfully",
    )


@router.get("/inspector-only", response_model=APIResponse[dict])
def inspector_check(current_user: User = Depends(require_roles("admin", "inspector"))):
    """Test RBAC enforcement: Admin or Inspector role."""
    return response_success(
        data={"user": current_user.email, "role": current_user.role},
        message="Inspector access verified successfully",
    )
