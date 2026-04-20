from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User

security = HTTPBearer()


@dataclass(frozen=True)
class CurrentUser:
    """Usuário autenticado resolvido a partir do JWT + consulta ao banco.

    Expor dataclass (e não dict) deixa as rotas mais legíveis e tipadas.
    """

    id: str
    restaurant_id: str
    email: str
    role: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token inválido') from exc

    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token inválido')

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # Token assinado, mas usuário não existe mais (deletado/revogado).
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuário não encontrado')

    return CurrentUser(
        id=user.id,
        restaurant_id=user.restaurant_id,
        email=user.email,
        role=user.role.value,
    )
