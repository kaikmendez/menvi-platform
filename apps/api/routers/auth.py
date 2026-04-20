from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import LoginIn, TokenOut
from ..security import create_access_token, verify_password

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/login', response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    email = payload.email.strip().lower()
    password = payload.password.strip()

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciais inválidas')

    token = create_access_token(
        user.id,
        {'restaurant_id': user.restaurant_id, 'email': user.email, 'role': user.role.value},
    )
    return TokenOut(access_token=token)
