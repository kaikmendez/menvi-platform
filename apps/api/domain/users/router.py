from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import CurrentUser, get_current_user, require_owner
from . import service
from .schemas import UserInviteIn, UserOut, UserUpdateIn

router = APIRouter(prefix='/crm/users', tags=['users'])

DEFAULT_INVITE_PASSWORD = 'menvi-change-me'


@router.get('', response_model=list[UserOut])
def list_users(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserOut]:
    users = service.list_users(db, restaurant_id=current_user.restaurant_id)
    return [UserOut.model_validate(u) for u in users]


@router.post('', response_model=UserOut, status_code=201)
def invite_user(
    payload: UserInviteIn,
    current_user: CurrentUser = Depends(require_owner),
    db: Session = Depends(get_db),
) -> UserOut:
    # MVP: cria usuário com senha provisória. Fase 5 troca por fluxo de convite por email.
    user = service.create_user(
        db,
        restaurant_id=current_user.restaurant_id,
        email=payload.email,
        name=payload.name,
        password=DEFAULT_INVITE_PASSWORD,
        role=payload.role,
    )
    return UserOut.model_validate(user)


@router.patch('/{user_id}', response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdateIn,
    current_user: CurrentUser = Depends(require_owner),
    db: Session = Depends(get_db),
) -> UserOut:
    user = service.update_user(
        db,
        restaurant_id=current_user.restaurant_id,
        user_id=user_id,
        name=payload.name,
        role=payload.role,
        is_active=payload.is_active,
    )
    return UserOut.model_validate(user)


@router.get('/me', response_model=UserOut)
def me(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    user = service.get_user(db, restaurant_id=current_user.restaurant_id, user_id=current_user.id)
    return UserOut.model_validate(user)
