from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..domain.users.models import User, UserRole
from .config import settings
from .db import get_db
from .errors import Forbidden, Unauthorized
from .security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    restaurant_id: str
    email: str
    role: UserRole

    def require_role(self, *allowed: UserRole) -> None:
        if self.role not in allowed:
            raise Forbidden('Permissão insuficiente')


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise Unauthorized('Token ausente')

    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise Unauthorized('Token inválido') from exc

    if payload.get('typ') != 'access':
        raise Unauthorized('Tipo de token inválido')

    user_id = payload.get('sub')
    if not user_id:
        raise Unauthorized('Token sem subject')

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise Unauthorized('Usuário não encontrado')

    return CurrentUser(
        id=user.id,
        restaurant_id=user.restaurant_id,
        email=user.email,
        role=user.role,
    )


def require_owner(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    current_user.require_role(UserRole.OWNER)
    return current_user


def require_manager_or_owner(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    current_user.require_role(UserRole.OWNER, UserRole.MANAGER)
    return current_user


def require_admin_token(x_admin_token: str | None = Header(default=None, alias='X-Admin-Token')) -> None:
    """Protege endpoints `/admin/*` via token simétrico configurado em `ADMIN_API_TOKEN`."""
    if not x_admin_token or x_admin_token != settings.admin_api_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Admin token inválido')
