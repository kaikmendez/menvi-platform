from __future__ import annotations

from sqlalchemy.orm import Session

from ...core.errors import Conflict, NotFound
from ...core.security import hash_password
from .models import User, UserRole


def list_users(db: Session, restaurant_id: str) -> list[User]:
    return db.query(User).filter(User.restaurant_id == restaurant_id).order_by(User.created_at.desc()).all()


def get_user(db: Session, restaurant_id: str, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id, User.restaurant_id == restaurant_id).first()
    if user is None:
        raise NotFound('Usuário não encontrado')
    return user


def create_user(
    db: Session,
    *,
    restaurant_id: str,
    email: str,
    name: str,
    password: str,
    role: UserRole,
) -> User:
    email = email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise Conflict('Email já cadastrado')
    user = User(
        restaurant_id=restaurant_id,
        email=email,
        name=name.strip(),
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: Session,
    *,
    restaurant_id: str,
    user_id: str,
    name: str | None = None,
    role: UserRole | None = None,
    is_active: bool | None = None,
) -> User:
    user = get_user(db, restaurant_id, user_id)
    if name is not None:
        user.name = name.strip()
    if role is not None:
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def set_password(db: Session, *, user_id: str, password: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise NotFound('Usuário não encontrado')
    user.password_hash = hash_password(password)
    db.commit()
    db.refresh(user)
    return user
