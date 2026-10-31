from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.user import User
from backend.app.schemas.auth import UserCreate
from backend.app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User, UserCreate, UserCreate]):
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Fetch user by unique email address."""
        return db.query(User).filter(User.email == email.lower()).first()

    def create_user(
        self, db: Session, *, name: str, email: str, password_hash: str, role: str = "inspector"
    ) -> User:
        """Create and store user account."""
        user = User(
            name=name,
            email=email.lower(),
            password_hash=password_hash,
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


user_repo = UserRepository(User)
