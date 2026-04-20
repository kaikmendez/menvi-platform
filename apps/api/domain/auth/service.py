from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.errors import Unauthorized
from ...core.security import create_access_token, create_refresh_token, decode_token, verify_password
from ..users.models import User
from .schemas import AccessTokenOut, TokenPair


def _build_tokens(user: User) -> TokenPair:
    extra = {'restaurant_id': user.restaurant_id, 'email': user.email, 'role': user.role.value}
    return TokenPair(
        access_token=create_access_token(user.id, extra),
        refresh_token=create_refresh_token(user.id),
    )


def authenticate(db: Session, *, email: str, password: str) -> TokenPair:
    normalized = email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized).first()
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise Unauthorized('Credenciais inválidas')
    return _build_tokens(user)


def refresh_access(db: Session, *, refresh_token: str) -> AccessTokenOut:
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise Unauthorized('Refresh token inválido') from exc
    if payload.get('typ') != 'refresh':
        raise Unauthorized('Tipo de token inválido')
    user_id = payload.get('sub')
    if not user_id:
        raise Unauthorized('Refresh token inválido')
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise Unauthorized('Usuário não encontrado')
    token = create_access_token(
        user.id,
        {'restaurant_id': user.restaurant_id, 'email': user.email, 'role': user.role.value},
    )
    return AccessTokenOut(access_token=token)
